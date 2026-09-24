import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { guildService } from '@/server/services/guild.service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id || '';

    const data = await guildService.getGuildDashboard(id, userId);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
