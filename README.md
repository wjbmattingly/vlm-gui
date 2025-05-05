# VLM Document Annotation Tool

This web application connects to a local database and allows users to upload images for transcription and Named Entity Recognition (NER) annotation. The application uses Vision-Language Models (VLMs) via the Hugging Face API to extract text and identify entities from uploaded documents.

## Features

- **Project Management**: Create and organize projects to group related documents
- **Document Upload**: Upload image files to be processed and annotated
- **Automatic Transcription**: Use VLM models to automatically extract text from images
- **NER Annotation**: Identify and categorize named entities in the transcribed text
- **Manual Correction**: Edit transcriptions and annotations with an easy-to-use interface
- **Export**: Download project data as a ZIP archive with images and JSON data

## Prerequisites

- Node.js 18+ and npm
- Hugging Face API token (for transcription functionality)
- Python (for the transcription functionality)
- gradio-client Python package (`pip install gradio-client`)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/vlm-gui.git
   cd vlm-gui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="file:./prisma/dev.db"
   HF_TOKEN="your_hugging_face_token"
   ```
   
   > **Important**: The Hugging Face token is required for the transcription functionality. You can get a token from your [Hugging Face account settings](https://huggingface.co/settings/tokens).

4. Set up the database:
   ```bash
   npx prisma migrate dev --name init
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Make sure your `.env` file exists and contains the correct `DATABASE_URL`.
2. The path in the SQLite connection string should point to where you want the database file to be created (e.g., `"file:./prisma/dev.db"`).
3. Run the migration command again:
   ```bash
   npx prisma migrate dev --name init
   ```

### Transcription Not Working

If document transcription isn't working:

1. Verify your Hugging Face token is correctly set in the `.env` file.
2. Make sure you have Python installed and accessible in your PATH.
3. Install the required Python dependencies:
   ```bash
   pip install gradio-client python-dotenv
   ```
4. Check for error messages in the browser console or server logs.
5. If needed, the application will fall back to mock data if the Hugging Face API connection fails.

### Node Module Type Issues

If you encounter TypeScript errors related to Node.js modules:

1. Add the following to the top of files using Node.js modules:
   ```typescript
   /// <reference types="node" />
   ```
2. Make sure you have `@types/node` installed:
   ```bash
   npm install --save-dev @types/node
   ```

## Usage

1. **Create a Project**: Start by creating a new project to organize your documents.
2. **Upload Documents**: Upload image files to your project.
3. **Transcribe**: Click the "Transcribe" button to extract text and entities from the document using VLM.
4. **Annotate**: Review and edit the transcription, adding or correcting entity labels as needed.
5. **Export**: Export your project or individual documents as a ZIP file containing the images and JSON annotation data.

## Customizing NER Labels

By default, the application uses the following NER labels:
- person
- organization
- location
- date
- event

You can customize these labels by entering a comma-separated list in the provided input field when transcribing a document.

## Technical Stack

- **Frontend**: Next.js, React, TailwindCSS, DaisyUI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (local database)
- **AI/ML**: Hugging Face API (Qwen2.5-VL-7B-Instruct model)
- **File Handling**: Node.js fs module, JSZip for export functionality

## License

MIT
