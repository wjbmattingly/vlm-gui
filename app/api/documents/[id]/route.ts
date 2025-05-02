import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { deleteFile } from '@/app/lib/file-utils';
import path from 'path';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/documents/[id] - Get a document by ID
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        annotations: true,
        project: true
      }
    });
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PUT /api/documents/[id] - Update a document
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    // Check if document exists
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : document.name,
        transcript: body.transcript !== undefined ? body.transcript : document.transcript,
      }
    });
    
    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    
    // Check if document exists
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Delete the file
    if (document.imagePath) {
      // Convert public path to local filesystem path
      const filePath = path.join(process.cwd(), 'public', document.imagePath.replace(/^\//, ''));
      deleteFile(filePath);
    }
    
    // Delete document (cascade will also delete annotations)
    await prisma.document.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
} 