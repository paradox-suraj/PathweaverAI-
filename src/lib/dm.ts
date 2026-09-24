import { eventManager } from './events';

// Ensure singleton is accessible across hot reloads in development

export type DMMessageEvent = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string | null;
  senderImage: string | null;
  content: string;
  createdAt: Date;
};

/**
 * Emits a DM message event to all SSE listeners on this thread.
 */
export function emitDMMessage(threadId: string, message: DMMessageEvent) {
  eventManager.emit(`dm:${threadId}`, message);
}
