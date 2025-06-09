# FastHTML Image Transcription

A web interface for extracting and transcribing text from images using Vision Language Models (VLMs), built with FastHTML.

## Features

- Upload images through a simple web interface
- Select from multiple VLM models for text transcription
- Provide custom instructions for transcription
- View transcription results directly in the browser
- Copy transcription results to clipboard
- History of previous transcriptions
- Responsive design with Pico CSS (included with FastHTML)

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd vlm-gui-fasthtml
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up API keys:
```bash
cp env.example .env
```
Then edit the `.env` file to add your API keys for the VLM services.

## Usage

1. Run the application:
```bash
python main.py
```

2. Open your browser and navigate to:
```
http://localhost:5001
```

3. Upload an image with text, select a model, provide any special instructions, and transcribe it.
4. View your transcription history to see previous results.

## Project Structure

- `main.py` - The main FastHTML application
- `vlm_api.py` - Integration with VLM APIs for transcription
- `uploads/` - Directory where uploaded images are stored
- `history/` - Directory where transcription history is saved as JSON files
- `env.example` - Example environment file for API keys

## How It Works

This application uses:

- **FastHTML** - A Python library that combines Starlette, Uvicorn, HTMX, and FastCore's FT "FastTags"
- **HTMX** - For dynamic content updates without writing JavaScript
- **Pico CSS** - For styling (automatically included with FastHTML)
- **Vision Language Models** - For extracting and transcribing text from images

The application flow:
1. User uploads an image containing text
2. Image is stored in the `uploads/` directory
3. User selects a model and provides any special instructions
4. Application calls the selected VLM API to transcribe the text
5. Results are saved to the history in the `history/` directory
6. User can view previous transcriptions in the history view

## Supported VLM Services

- **OpenAI's GPT-4 Vision** - Requires an OpenAI API key
- **Google's Gemini Pro Vision** - Requires a Google API key
- **Anthropic's Claude 3 Vision** - Requires an Anthropic API key

## Future Improvements

- OCR-specific optimizations for better text extraction
- Support for document parsing and table extraction
- Custom templates for different types of documents
- Batch processing of multiple images
- Export functionality for transcriptions (PDF, Word, etc.)

## License

MIT 