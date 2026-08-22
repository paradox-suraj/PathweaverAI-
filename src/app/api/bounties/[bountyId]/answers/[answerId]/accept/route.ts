import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bountyId: string; answerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bountyId, answerId } = await params;
    const userId = session.user.id;

    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    
    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }

    if (bounty.creatorId !== userId) {
      return NextResponse.json({ error: 'Only the creator can accept an answer' }, { status: 403 });
    }

    if (bounty.status !== 'OPEN') {
      return NextResponse.json({ error: 'Bounty is not open' }, { status: 400 });
    }

    const answer = await prisma.bountyAnswer.findUnique({ where: { id: answerId } });

    if (!answer || answer.bountyId !== bountyId) {
      return NextResponse.json({ error: 'Answer not found for this bounty' }, { status: 404 });
    }

    // Accept answer, close bounty, reward XP in transaction
    await prisma.$transaction([
      prisma.bountyAnswer.update({
        where: { id: answerId },
        data: { isAccepted: true },
      }),
      prisma.bounty.update({
        where: { id: bountyId },
        data: { status: 'ANSWERED' },
      }),
      // Reward XP to the answer author
      prisma.userStat.upsert({
        where: { userId: answer.authorId },
        update: { xp: { increment: bounty.rewardXP } },
        create: { userId: answer.authorId, xp: bounty.rewardXP },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to accept answer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
