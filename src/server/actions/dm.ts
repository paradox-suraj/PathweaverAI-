'use server';

import { auth } from '@/auth';
import { dmService } from '../services/dm.service';

export async function sendDM(recipientId: string, content: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const thread = await dmService.getOrCreateThread(session.user.id, recipientId);
    await dmService.sendMessage(thread.id, session.user.id, content);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMyThreads() {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const threads = await dmService.getThreadsForUser(session.user.id);
    return { success: true, threads };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markRead(threadId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await dmService.markThreadRead(threadId, session.user.id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDMMessages(threadId: string, cursor?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const messages = await dmService.getMessages(threadId, session.user.id, cursor);
    return { success: true, messages };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
