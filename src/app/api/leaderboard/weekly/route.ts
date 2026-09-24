import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type');
    
    if (type === 'alltime') {
      const topUsers = await prisma.userStat.findMany({
        orderBy: { xp: 'desc' },
        take: 50,
        include: { user: { select: { name: true, image: true, username: true } } },
      });
      return NextResponse.json({ leaderboard: topUsers.map(u => ({ userId: u.userId, xp: u.xp, user: u.user })) });
    }

    // Weekly logic
    const now = new Date();
    const weekStr = `${now.getUTCFullYear()}-W${String(Math.ceil((((now.getTime() - new Date(Date.UTC(now.getUTCFullYear(),0,1)).getTime()) / 86400000) + new Date(Date.UTC(now.getUTCFullYear(),0,1)).getUTCDay() + 1) / 7)).padStart(2,'0')}`;
    const redisKey = `leaderboard:weekly:${weekStr}`;
    const cacheKey = `${redisKey}:hydrated`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }

    // Fetch top 50
    const rawScores = await redis.zrevrange(redisKey, 0, 49, 'WITHSCORES');
    const leaderboard: { userId: string; xp: number }[] = [];
    
    for (let i = 0; i < rawScores.length; i += 2) {
      leaderboard.push({
        userId: rawScores[i],
        xp: parseInt(rawScores[i+1], 10),
      });
    }

    if (leaderboard.length === 0) {
      return NextResponse.json({ leaderboard: [], week: weekStr });
    }

    const userIds = leaderboard.map(l => l.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true, username: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));
    const hydrated = leaderboard.map(l => ({
      ...l,
      user: userMap.get(l.userId) || { name: 'Unknown User', image: null, username: null },
    }));

    const result = { leaderboard: hydrated, week: weekStr };
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 300); // 5 min cache

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
