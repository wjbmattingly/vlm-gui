import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env

const execAsync = promisify(exec);

// Helper type for NER entity
export interface NerEntity {
  token: string;
  class_or_confidence: string | null;
}

// Mock transcription for development without API key
export async function mockTranscribeImage(): Promise<NerEntity[]> {
  return [
    { token: 'Error transcribing image', class_or_confidence: null }
  ];
}

// Write a Python script to temp directory and execute it
export async function transcribeImage(
  imagePath: string,
  nerLabels: string = 'person, organization, location, date, event',
  modelName: string = 'Qwen/Qwen2.5-VL-7B-Instruct'
): Promise<NerEntity[]> {
  try {
    // For development, use mock data if no HF token is available
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      console.warn('No Hugging Face token found, using mock data');
      return mockTranscribeImage();
    }

    // Create a temporary Python script
    const scriptPath = path.join(process.cwd(), 'temp_transcribe.py');
    const scriptContent = `
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
image_path = "${imagePath.replace(/\\/g, '\\\\')}"
model = "${modelName}"
ner_enabled = True
ner_labels = "${nerLabels}"

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
`;

    fs.writeFileSync(scriptPath, scriptContent);

    // Execute the Python script
    const { stdout, stderr } = await execAsync(`python ${scriptPath}`);
    
    if (stderr && !stdout) {
      console.error('Python script error:', stderr);
      throw new Error(`Transcription failed: ${stderr}`);
    }

    // Clean up the temporary script
    fs.unlinkSync(scriptPath);

    // Parse the output
    const lines = stdout.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    const result = JSON.parse(lastLine) as NerEntity[];
    return result || [];
  } catch (error) {
    console.error('Error transcribing image:', error);
    // Fall back to mock data in case of error
    console.warn('Transcription failed, using mock data');
    return mockTranscribeImage();
  }
} 