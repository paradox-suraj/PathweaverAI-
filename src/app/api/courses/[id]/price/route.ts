import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;

    const body = await req.json();
    const { price } = body;

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    // Ensure the user owns the course
    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course || course.userId !== session.user.id) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 });
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        price,
        currency: 'INR',
      },
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error('Failed to update course price:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
