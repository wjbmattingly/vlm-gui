import os
import json
import base64
from pathlib import Path
from typing import Optional

# This file contains example integrations with VLM APIs for transcription

class TranscriptionService:
    """Base class for transcription services"""
    
    def __init__(self):
        pass
        
    async def transcribe_image(self, image_path: str, prompt: str) -> str:
        """Transcribe text from an image"""
        raise NotImplementedError("Subclasses must implement this method")


class OpenAITranscription(TranscriptionService):
    """OpenAI's GPT-4 Vision API for transcription"""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__()
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
            
    async def transcribe_image(self, image_path: str, prompt: str) -> str:
        """Use GPT-4 Vision to transcribe text from an image"""
        try:
            import httpx
            
            # Read image and encode as base64
            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode("utf-8")
            
            # Prepare the API request
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            # Construct a prompt that focuses on transcription
            transcription_prompt = f"Please transcribe all the text visible in this image. {prompt}"
            
            payload = {
                "model": "gpt-4-vision-preview",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": transcription_prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 1000
            }
            
            # Make the API request
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                
            response_data = response.json()
            return response_data["choices"][0]["message"]["content"]
            
        except Exception as e:
            return f"Error transcribing image: {str(e)}"


class GoogleTranscription(TranscriptionService):
    """Google's Gemini Pro Vision API for transcription"""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__()
        self.api_key = api_key or os.environ.get("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Google API key is required")
    
    async def transcribe_image(self, image_path: str, prompt: str) -> str:
        """Use Gemini Pro Vision to transcribe text from an image"""
        try:
            import httpx
            
            # Read image and encode as base64
            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode("utf-8")
            
            # Prepare the API request
            headers = {
                "Content-Type": "application/json"
            }
            
            # Construct a prompt that focuses on transcription
            transcription_prompt = f"Please transcribe all the text visible in this image. {prompt}"
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": transcription_prompt},
                            {
                                "inline_data": {
                                    "mime_type": "image/jpeg",
                                    "data": image_data
                                }
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 1000
                }
            }
            
            # Make the API request
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key={self.api_key}",
                    headers=headers,
                    json=payload
                )
                
            response_data = response.json()
            return response_data["candidates"][0]["content"]["parts"][0]["text"]
            
        except Exception as e:
            return f"Error transcribing image: {str(e)}"


class AnthropicTranscription(TranscriptionService):
    """Anthropic's Claude 3 Vision API for transcription"""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__()
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key is required")
    
    async def transcribe_image(self, image_path: str, prompt: str) -> str:
        """Use Claude 3 Vision to transcribe text from an image"""
        try:
            import httpx
            
            # Read image and encode as base64
            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode("utf-8")
            
            # Prepare the API request
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01"
            }
            
            # Construct a prompt that focuses on transcription
            transcription_prompt = f"Please transcribe all the text visible in this image. {prompt}"
            
            payload = {
                "model": "claude-3-opus-20240229",
                "max_tokens": 1000,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": transcription_prompt
                            },
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": image_data
                                }
                            }
                        ]
                    }
                ]
            }
            
            # Make the API request
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers=headers,
                    json=payload
                )
                
            response_data = response.json()
            return response_data["content"][0]["text"]
            
        except Exception as e:
            return f"Error transcribing image: {str(e)}"


# Factory function to get the appropriate transcription service
def get_transcription_service(model_name: str) -> TranscriptionService:
    """Get a transcription service based on the model name"""
    if model_name == "gpt-4-vision":
        return OpenAITranscription()
    elif model_name == "gemini-pro-vision":
        return GoogleTranscription()
    elif model_name == "claude-3-vision":
        return AnthropicTranscription()
    else:
        raise ValueError(f"Unsupported model: {model_name}") 