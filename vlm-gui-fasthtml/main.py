from fasthtml.common import *
import os
import json
import dotenv
from pathlib import Path
from datetime import datetime
from vlm_api import get_transcription_service

# Load environment variables
dotenv.load_dotenv()

# Create necessary directories
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
HISTORY_DIR = Path("history")
HISTORY_DIR.mkdir(exist_ok=True)

# Available models (would connect to real APIs in production)
MODELS = {
    "gpt-4-vision": "GPT-4 Vision",
    "gemini-pro-vision": "Gemini Pro Vision",
    "claude-3-vision": "Claude 3 Vision"
}

app, rt = fast_app()

# Save analysis to history
def save_to_history(image_path, prompt, model, response):
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    history_file = HISTORY_DIR / f"{timestamp}.json"
    history_data = {
        "timestamp": timestamp,
        "image_path": str(image_path),
        "prompt": prompt,
        "model": model,
        "response": response
    }
    with open(history_file, 'w') as f:
        json.dump(history_data, f)
    return timestamp

# Get history entries
def get_history():
    entries = []
    for file in HISTORY_DIR.glob("*.json"):
        with open(file, 'r') as f:
            try:
                data = json.load(f)
                entries.append(data)
            except json.JSONDecodeError:
                continue
    # Sort by timestamp, newest first
    entries.sort(key=lambda x: x["timestamp"], reverse=True)
    return entries

@rt("/upload")
async def post(file: UploadFile):
    # Process the uploaded image file
    filename = file.filename
    content_type = file.content_type
    
    # Save the file
    file_path = UPLOAD_DIR / filename
    file_content = await file.read()
    file_path.write_bytes(file_content)
    
    # Return image preview and form for VLM analysis
    return Card(
        Header(H3(f"Uploaded: {filename}")),
        Div(
            Img(src=f"/uploads/{filename}", style="max-width: 100%; max-height: 300px;"),
            id="image-preview"
        ),
        Div(
            Form(
                Fieldset(
                    Label("Select Transcription Model:", 
                          Select(
                              *[Option(name, value=id) for id, name in MODELS.items()],
                              name="model"
                          )),
                    Label("Transcription Instructions:", 
                          Textarea(name="prompt", rows=3, 
                                  placeholder="Any special instructions for transcription? (e.g., 'Focus on handwritten text' or 'Extract table data')")),
                    Input(type="hidden", name="image_path", value=str(file_path)),
                    Input(type="hidden", name="image_filename", value=filename),
                    Button("Transcribe", type="submit", cls="primary")
                ),
                hx_post="/analyze",
                hx_target="#model-results",
                hx_indicator="#loading-indicator"
            ),
            id="prompt-form"
        ),
        Div(
            Div("Processing...", id="loading-indicator", cls="htmx-indicator"),
            id="model-results"
        )
    )

@rt("/analyze")
async def post(image_path: str, image_filename: str, prompt: str, model: str):
    model_name = MODELS.get(model, "Unknown Model")
    
    try:
        # Get the appropriate transcription service
        transcription_service = get_transcription_service(model)
        
        # Call the transcription service
        response = await transcription_service.transcribe_image(image_path, prompt)
    except Exception as e:
        # If there's an error, use a simulated response
        response = f"Error using {model_name}: {str(e)}\n\nSimulated transcription response: This is where the actual transcription would appear if API keys were configured."
    
    # Save to history
    timestamp = save_to_history(image_path, prompt, model, response)
    
    return Div(
        H3(f"Transcription from {model_name}"),
        P(f"Instructions: \"{prompt}\"") if prompt else "",
        Div(
            response,
            cls="response-text"
        ),
        Div(
            Button("Copy to Clipboard", 
                   hx_on="click: navigator.clipboard.writeText(document.querySelector('.response-text').innerText).then(() => alert('Copied to clipboard!'))",
                   cls="outline"),
            Button("View History", hx_get="/history", hx_target="#app-container", cls="outline"),
            Button("New Transcription", hx_get="/", hx_target="body", cls="secondary"),
            cls="button-row"
        ),
        id="model-results"
    )

@rt("/history")
def get():
    history = get_history()
    
    if not history:
        return Card(
            Header(H3("Transcription History")),
            P("No history found. Try transcribing some images first."),
            footer=Div(
                Button("Back to Upload", hx_get="/", hx_target="body"),
                cls="text-center"
            )
        )
    
    history_items = []
    for entry in history:
        image_filename = os.path.basename(entry["image_path"])
        history_items.append(
            Card(
                Div(
                    Img(src=f"/uploads/{image_filename}", style="max-width: 100%; max-height: 150px;"),
                    cls="history-image"
                ),
                Div(
                    H4(f"Model: {MODELS.get(entry['model'], entry['model'])}"),
                    P(f"Instructions: \"{entry['prompt']}\"") if entry['prompt'] else "",
                    P(f"Transcription: {entry['response'][:100]}..."),
                    P(f"Date: {datetime.strptime(entry['timestamp'], '%Y%m%d%H%M%S').strftime('%Y-%m-%d %H:%M:%S')}"),
                    Button("View Full", 
                           hx_get=f"/history/{entry['timestamp']}", 
                           hx_target="#app-container",
                           cls="outline small"),
                    cls="history-details"
                ),
                cls="history-item"
            )
        )
    
    return Titled("Transcription History",
        Div(
            Button("Back to Upload", hx_get="/", hx_target="body", cls="outline"),
            cls="text-right"
        ),
        Div(*history_items, id="history-list"),
        Style("""
            .history-item {
                display: flex;
                margin-bottom: 20px;
            }
            .history-image {
                flex: 0 0 150px;
                margin-right: 20px;
                text-align: center;
            }
            .history-details {
                flex: 1;
            }
            .small {
                padding: 0.25rem 0.5rem;
                font-size: 0.8rem;
            }
        """)
    )

@rt("/history/{timestamp}")
def get(timestamp: str):
    try:
        history_file = HISTORY_DIR / f"{timestamp}.json"
        with open(history_file, 'r') as f:
            entry = json.load(f)
        
        image_filename = os.path.basename(entry["image_path"])
        
        return Card(
            Header(H3("Transcription Details")),
            Grid(
                Div(
                    Img(src=f"/uploads/{image_filename}", style="max-width: 100%;"),
                    cls="image-container"
                ),
                Div(
                    H4(f"Model: {MODELS.get(entry['model'], entry['model'])}"),
                    P(f"Instructions: \"{entry['prompt']}\"") if entry['prompt'] else "",
                    H4("Transcription:"),
                    Div(
                        entry['response'],
                        cls="response-text"
                    ),
                    P(f"Date: {datetime.strptime(entry['timestamp'], '%Y%m%d%H%M%S').strftime('%Y-%m-%d %H:%M:%S')}"),
                    cls="details-container"
                )
            ),
            footer=Div(
                Button("Copy to Clipboard", 
                       hx_on="click: navigator.clipboard.writeText(document.querySelector('.response-text').innerText).then(() => alert('Copied to clipboard!'))",
                       cls="outline"),
                Button("Back to History", hx_get="/history", hx_target="#app-container", cls="outline"),
                Button("New Transcription", hx_get="/", hx_target="body", cls="secondary"),
                cls="button-row"
            )
        )
    except (FileNotFoundError, json.JSONDecodeError):
        return Titled("Error", P("History entry not found"))

@rt("/{fname:path}.{ext:static}")
def get(fname: str, ext: str):
    return FileResponse(f'{fname}.{ext}')

@rt("/uploads/{filename}")
def get(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        return Titled("Error", P("File not found"))
    return FileResponse(str(file_path))

# Create the home page with the image upload form and VLM interface
@rt("/")
def get():
    return Titled("FastHTML Image Transcription", 
        Card(
            Header(H3("Image Text Transcription")),
            Div(
                Form(
                    Fieldset(
                        Label("Upload an image with text to transcribe:", 
                              Input(type="file", name="file", accept="image/*")),
                        Button("Upload", type="submit", cls="primary")
                    ),
                    hx_post="/upload",
                    hx_target="#app-container",
                    hx_encoding="multipart/form-data",
                    hx_indicator="#upload-indicator"
                ),
                Div("Uploading...", id="upload-indicator", cls="htmx-indicator"),
                id="upload-form"
            ),
            Div(id="app-container"),
            footer=Div(
                Div(
                    Button("View History", hx_get="/history", hx_target="#app-container", cls="outline"),
                    cls="text-center"
                ),
                P("Upload an image to extract and transcribe text using vision language models."),
                cls="text-center"
            )
        ),
        Style("""
            .card {
                max-width: 800px;
                margin: 0 auto;
            }
            #image-preview {
                text-align: center;
                margin: 20px 0;
            }
            .response-text {
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 8px;
                margin-top: 10px;
                white-space: pre-wrap;
                font-family: monospace;
            }
            .button-row {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
            }
            .htmx-indicator {
                display: none;
            }
            .htmx-request .htmx-indicator {
                display: block;
            }
            .htmx-request.htmx-indicator {
                display: block;
            }
            .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            @media (max-width: 768px) {
                .grid {
                    grid-template-columns: 1fr;
                }
            }
        """)
    )

serve() 