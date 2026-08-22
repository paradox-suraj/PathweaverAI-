import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'OPEN';

    const bounties = await prisma.bounty.findMany({
      where: { status },
      include: {
        creator: { select: { name: true, image: true } },
        _count: { select: { answers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bounties);
  } catch (error) {
    console.error('Failed to get bounties:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questionText, rewardXP, topicId } = await req.json();

    if (!questionText || !rewardXP || rewardXP < 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const userId = session.user.id;

    // Check if user has enough XP
    const userStat = await prisma.userStat.findUnique({ where: { userId } });
    if (!userStat || userStat.xp < rewardXP) {
      return NextResponse.json({ error: 'Not enough XP' }, { status: 400 });
    }

    // Deduct XP and create bounty in a transaction
    const bounty = await prisma.$transaction([
      prisma.userStat.update({
        where: { userId },
        data: { xp: { decrement: rewardXP } },
      }),
      prisma.bounty.create({
        data: {
          creatorId: userId,
          questionText,
          rewardXP,
          topicId,
        },
      }),
    ]);

    return NextResponse.json(bounty[1]);
  } catch (error) {
    console.error('Failed to create bounty:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
