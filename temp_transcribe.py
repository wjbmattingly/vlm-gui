
import os
import json
import dotenv
from gradio_client import Client, file

# Load environment variables
dotenv.load_dotenv()

# Get token from environment
hf_token = os.getenv("HF_TOKEN")

# Create client for Hugging Face Space
client = Client("wjbmattingly/caracal", hf_token=hf_token)

# Parameters
image_path = "/Users/wjm55/yale/vlm-gui/public/uploads/ffc4fb93-70fb-40a5-adaf-67c0d4074735-Fanny Vs Tillets 1827-02_page_027.png"
model = "Qwen/Qwen2.5-VL-7B-Instruct"
ner_enabled = True
ner_labels = "person, organization, location, date, event"

# Call the API
result = client.predict(
    file(image_path),      # Path to image as file object
    model,           # Model selection
    ner_enabled,     # NER enabled
    ner_labels,      # NER labels
    api_name="/run_example"
)

# Print the result as JSON
print(json.dumps(result))
