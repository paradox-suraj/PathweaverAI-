import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getWatchPartyState,
  updateWatchPartyState,
  joinWatchParty,
  getParticipants,
  addMessage,
  getMessages,
  addReaction,
  getReactions,
  addVoicePeer,
  getVoicePeers,
} from '@/lib/watchParty';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ partyId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { partyId } = await params;
    const body = await req.json();
    const { action, payload } = body;

    const state = await getWatchPartyState(partyId);
    if (!state) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    const userId = session.user.id;
    const userName = session.user.name || 'Anonymous';

    // Ensure user is joined
    await joinWatchParty(partyId, userId);

    let updatedState = state;

    if (action === 'UPDATE_STATE' && state.hostId === userId) {
      // Only host can update video state
      updatedState = await updateWatchPartyState(partyId, payload) || state;
    } else if (action === 'SEND_MESSAGE') {
      await addMessage(partyId, userId, userName, payload.content);
    } else if (action === 'SEND_REACTION') {
      await addReaction(partyId, userId, payload.emoji);
    } else if (action === 'REGISTER_VOICE_PEER') {
      await addVoicePeer(partyId, payload.peerId);
    }

    // Return the latest state + messages (maybe limit to last 50)
    const messages = await getMessages(partyId, -50, -1);
    const participants = await getParticipants(partyId);
    const reactions = await getReactions(partyId, -20, -1);
    const voicePeers = await getVoicePeers(partyId);

    return NextResponse.json({
      state: updatedState,
      messages,
      participants,
      reactions,
      voicePeers,
    });
  } catch (error) {
    console.error('Watch Party sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
