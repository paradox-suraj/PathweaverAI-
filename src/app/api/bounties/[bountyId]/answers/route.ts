import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Submit an answer
export async function POST(
  req: Request,
  { params }: { params: Promise<{ bountyId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bountyId } = await params;
    const { answerText } = await req.json();

    if (!answerText) {
      return NextResponse.json({ error: 'answerText is required' }, { status: 400 });
    }

    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }
    
    if (bounty.status !== 'OPEN') {
      return NextResponse.json({ error: 'Bounty is no longer open' }, { status: 400 });
    }

    const answer = await prisma.bountyAnswer.create({
      data: {
        bountyId,
        authorId: session.user.id,
        answerText,
      },
    });

    return NextResponse.json(answer);
  } catch (error) {
    console.error('Failed to submit answer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
