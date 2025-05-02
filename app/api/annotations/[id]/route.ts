import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/annotations/[id] - Get an annotation by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    const annotation = await prisma.annotation.findUnique({
      where: { id },
      include: {
        document: true
      }
    });
    
    if (!annotation) {
      return NextResponse.json(
        { error: 'Annotation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(annotation);
  } catch (error) {
    console.error('Error fetching annotation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annotation' },
      { status: 500 }
    );
  }
}

// PUT /api/annotations/[id] - Update an annotation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Check if annotation exists
    const annotation = await prisma.annotation.findUnique({ where: { id } });
    if (!annotation) {
      return NextResponse.json(
        { error: 'Annotation not found' },
        { status: 404 }
      );
    }
    
    // Update annotation
    const updatedAnnotation = await prisma.annotation.update({
      where: { id },
      data: {
        token: body.token !== undefined ? body.token : annotation.token,
        nerClass: body.nerClass !== undefined ? body.nerClass : annotation.nerClass,
        startIndex: body.startIndex !== undefined ? body.startIndex : annotation.startIndex,
        endIndex: body.endIndex !== undefined ? body.endIndex : annotation.endIndex,
      }
    });
    
    return NextResponse.json(updatedAnnotation);
  } catch (error) {
    console.error('Error updating annotation:', error);
    return NextResponse.json(
      { error: 'Failed to update annotation' },
      { status: 500 }
    );
  }
}

// DELETE /api/annotations/[id] - Delete an annotation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Check if annotation exists
    const annotation = await prisma.annotation.findUnique({ where: { id } });
    if (!annotation) {
      return NextResponse.json(
        { error: 'Annotation not found' },
        { status: 404 }
      );
    }
    
    // Delete annotation
    await prisma.annotation.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting annotation:', error);
    return NextResponse.json(
      { error: 'Failed to delete annotation' },
      { status: 500 }
    );
  }
} 