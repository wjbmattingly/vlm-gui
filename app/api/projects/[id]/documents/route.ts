import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { saveFile } from '@/app/lib/file-utils';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/projects/[id]/documents - Get all documents for a project
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    
    // Check if project exists
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Get all documents for the project
    const documents = await prisma.document.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        annotations: true
      }
    });
    
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/documents - Create a new document in a project
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { id: projectId } = await context.params;
    
    // Check if project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Parse form data with file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string || file.name;
    
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }
    
    // Save the file
    const fileInfo = await saveFile(file);
    
    // Create document in database
    const document = await prisma.document.create({
      data: {
        name,
        imagePath: fileInfo.publicPath,
        projectId,
      }
    });
    
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
} 