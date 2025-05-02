import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { transcribeImage } from '@/app/lib/transcription-service';
import path from 'path';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/documents/[id]/transcribe - Transcribe a document
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    // Get NER labels from request or use default
    const nerLabels = body.nerLabels || 'person, organization, location, date, event';
    const modelName = body.modelName || 'Qwen/Qwen2.5-VL-7B-Instruct';
    
    // Check if document exists
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Get full filesystem path of the image
    const imagePath = path.join(process.cwd(), 'public', document.imagePath.replace(/^\//, ''));
    
    // Call transcription service
    const transcriptionResult = await transcribeImage(imagePath, nerLabels, modelName);
    
    // Update document with transcription result
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        transcript: transcriptionResult,
      }
    });
    
    // Create annotation records for recognized entities
    const annotations = [];
    for (let i = 0; i < transcriptionResult.length; i++) {
      const entity = transcriptionResult[i];
      if (entity.class_or_confidence) {
        // Create annotation
        const annotation = await prisma.annotation.create({
          data: {
            token: entity.token,
            nerClass: entity.class_or_confidence.trim(),
            startIndex: i,
            endIndex: i + 1,
            documentId: id,
          }
        });
        annotations.push(annotation);
      }
    }
    
    // Return updated document with annotations
    return NextResponse.json({
      document: updatedDocument,
      annotations
    });
  } catch (error) {
    console.error('Error transcribing document:', error);
    return NextResponse.json(
      { error: `Failed to transcribe document: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 