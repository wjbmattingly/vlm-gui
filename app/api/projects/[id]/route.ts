import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/projects/[id] - Get a project by ID
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    // Check if project exists
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: body.name ?? project.name,
        description: body.description ?? project.description,
      }
    });
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(request: NextRequest, context: RouteParams) {
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
    
    // Delete project (cascade will also delete related documents and annotations)
    await prisma.project.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
} 