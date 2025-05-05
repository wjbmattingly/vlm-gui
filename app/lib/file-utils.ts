/// <reference types="node" />
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';

// Base directory for uploads
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface UploadedFile {
  filename: string;
  path: string;
  publicPath: string;
}

/**
 * Save a file to the uploads directory
 */
export async function saveFile(file: File): Promise<UploadedFile> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Create unique filename
  const uniqueId = uuidv4();
  const filename = `${uniqueId}-${file.name}`;
  const filePath = path.join(UPLOADS_DIR, filename);
  
  // Write the file
  fs.writeFileSync(filePath, buffer);
  
  // Return file info
  return {
    filename: file.name,
    path: filePath,
    publicPath: `/uploads/${filename}`
  };
}

/**
 * Create a ZIP archive containing images and JSON data
 */
export async function createExportZip(
  documents: Array<{ id: string; name: string; imagePath: string; transcript: any }>,
  exportPath?: string
): Promise<string> {
  const zip = new JSZip();
  
  // Add each document to the zip
  for (const doc of documents) {
    try {
      const imageName = path.basename(doc.imagePath);
      const imagePath = path.join(process.cwd(), 'public', doc.imagePath.replace(/^\//, ''));
      
      if (fs.existsSync(imagePath)) {
        const imageData = fs.readFileSync(imagePath);
        zip.file(`images/${imageName}`, imageData);
      }
      // Add NER annotations as JSON, with both annotations and raw_text keys
      let rawText = '';
      if (Array.isArray(doc.transcript)) {
        rawText = doc.transcript.map((e: any) => e.token).join('');
      }
      zip.file(
        `data/${doc.id}.ner_annotations.json`,
        JSON.stringify({ annotations: doc.transcript, raw_text: rawText }, null, 2)
      );
      // Add raw text file (concatenate all tokens, preserving line breaks)
      zip.file(`data/${doc.id}.raw_text.txt`, rawText);
    } catch (error) {
      console.error(`Error adding document ${doc.id} to ZIP:`, error);
    }
  }
  
  // Generate the ZIP file
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const zipFilename = `export-${Date.now()}.zip`;
  const zipPath = exportPath || path.join(UPLOADS_DIR, zipFilename);
  
  fs.writeFileSync(zipPath, zipBuffer);
  
  return zipPath;
}

/**
 * Delete a file
 */
export function deleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
} 