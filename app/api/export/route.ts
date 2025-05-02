import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { createExportZip } from '@/app/lib/file-utils';
import path from 'path';
import fs from 'fs';

// POST /api/export - Export documents as ZIP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentIds, projectId } = body;
    
    let documents = [];
    
    // If projectId is provided, export all documents in the project
    if (projectId) {
      documents = await prisma.document.findMany({
        where: {
          projectId,
        },
        include: {
          annotations: true,
        },
      });
    } 
    // If documentIds are provided, export only those documents
    else if (documentIds && documentIds.length > 0) {
      documents = await prisma.document.findMany({
        where: {
          id: { in: documentIds },
        },
        include: {
          annotations: true,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Either projectId or documentIds must be provided' },
        { status: 400 }
      );
    }
    
    if (documents.length === 0) {
      return NextResponse.json(
        { error: 'No documents found to export' },
        { status: 404 }
      );
    }
    
    // Generate ZIP with documents and annotations
    const zipPath = await createExportZip(documents);
    
    // Convert to public URL
    const zipFileName = path.basename(zipPath);
    const publicPath = `/uploads/${zipFileName}`;
    
    return NextResponse.json({
      success: true,
      downloadUrl: publicPath,
      count: documents.length,
    });
  } catch (error) {
    console.error('Error exporting documents:', error);
    return NextResponse.json(
      { error: 'Failed to export documents' },
      { status: 500 }
    );
  }
}

// Route handler for GET request to download the ZIP file
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }
    
    // Ensure the path is within the uploads directory for security
    if (!filePath.startsWith('/uploads/')) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }
    
    const fullPath = path.join(process.cwd(), 'public', filePath.replace(/^\//, ''));
    
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Read the file and return it as a response
    const fileBuffer = fs.readFileSync(fullPath);
    const fileName = path.basename(fullPath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=${fileName}`,
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
} 