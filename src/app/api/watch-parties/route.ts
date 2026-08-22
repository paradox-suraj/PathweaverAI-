import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createWatchParty } from '@/lib/watchParty';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    const partyId = crypto.randomUUID();
    const party = await createWatchParty(partyId, courseId, session.user.id);

    return NextResponse.json(party);
  } catch (error) {
    console.error('Create Watch Party error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
