import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dmService } from '@/server/services/dm.service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await params;
    const session = await auth();
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const cursor = req.nextUrl.searchParams.get('cursor') || undefined;
    const messages = await dmService.getMessages(threadId, session.user.id, cursor);

    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await params;
    const session = await auth();
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    if (!body.content) return new NextResponse('Missing content', { status: 400 });

    const message = await dmService.sendMessage(threadId, session.user.id, body.content);

    return NextResponse.json({ message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
