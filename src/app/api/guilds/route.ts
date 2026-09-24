import { NextRequest, NextResponse } from 'next/server';
import { guildService } from '@/server/services/guild.service';

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get('query') || undefined;
    const topic = req.nextUrl.searchParams.get('topic') || undefined;
    const skip = parseInt(req.nextUrl.searchParams.get('skip') || '0', 10);
    const take = parseInt(req.nextUrl.searchParams.get('take') || '20', 10);

    const guilds = await guildService.listGuilds(query, topic, skip, take);
    return NextResponse.json({ guilds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
