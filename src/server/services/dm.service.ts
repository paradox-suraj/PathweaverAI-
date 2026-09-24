import { prisma } from '@/lib/prisma';
import { emitDMMessage } from '@/lib/dm';
import { notificationService } from './notification.service';

export class DmService {
  /**
   * Checks whether two users mutually follow each other.
   */
  async areMutualFollowers(userAId: string, userBId: string): Promise<boolean> {
    const [aFollowsB, bFollowsA] = await Promise.all([
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userAId, followingId: userBId } },
      }),
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userBId, followingId: userAId } },
      }),
    ]);
    return !!aFollowsB && !!bFollowsA;
  }

  /**
   * Returns the canonical [participantA, participantB] ordering (lexicographic).
   */
  private canonicalOrder(userAId: string, userBId: string): [string, string] {
    return userAId < userBId ? [userAId, userBId] : [userBId, userAId];
  }

  /**
   * Checks mutual-follow constraint and upserts a DM thread between two users.
   */
  async getOrCreateThread(userAId: string, userBId: string) {
    if (userAId === userBId) throw new Error('Cannot message yourself.');

    const mutual = await this.areMutualFollowers(userAId, userBId);
    if (!mutual) throw new Error('You can only message users who follow you back.');

    const [pA, pB] = this.canonicalOrder(userAId, userBId);

    return prisma.directMessageThread.upsert({
      where: { participantAId_participantBId: { participantAId: pA, participantBId: pB } },
      create: { participantAId: pA, participantBId: pB },
      update: {},
      include: {
        participantA: { select: { id: true, name: true, image: true, username: true } },
        participantB: { select: { id: true, name: true, image: true, username: true } },
      },
    });
  }

  /**
   * Verifies that a user is a participant in the given thread.
   */
  async isParticipant(threadId: string, userId: string): Promise<boolean> {
    const thread = await prisma.directMessageThread.findUnique({
      where: { id: threadId },
      select: { participantAId: true, participantBId: true },
    });
    if (!thread) return false;
    return thread.participantAId === userId || thread.participantBId === userId;
  }

  /**
   * Sends a message to a thread and notifies the recipient via SSE + notification.
   */
  async sendMessage(threadId: string, senderId: string, content: string) {
    if (!content.trim()) throw new Error('Message cannot be empty.');
    if (content.length > 2000) throw new Error('Message exceeds 2000 character limit.');

    const ok = await this.isParticipant(threadId, senderId);
    if (!ok) throw new Error('Unauthorized: you are not a member of this thread.');

    const thread = await prisma.directMessageThread.findUniqueOrThrow({
      where: { id: threadId },
      include: {
        participantA: { select: { name: true, image: true } },
        participantB: { select: { name: true, image: true } },
      },
    });

    const [message] = await prisma.$transaction([
      prisma.directMessage.create({
        data: { threadId, senderId, content },
        include: { sender: { select: { id: true, name: true, image: true } } },
      }),
      prisma.directMessageThread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    // Emit real-time SSE event
    const dmEvent = {
      id: message.id,
      threadId,
      senderId,
      senderName: (message as any).sender.name,
      senderImage: (message as any).sender.image,
      content: message.content,
      createdAt: message.createdAt,
    };
    emitDMMessage(threadId, dmEvent);

    // Send notification to recipient
    const recipientId =
      thread.participantAId === senderId ? thread.participantBId : thread.participantAId;
    const senderName = (thread as any).participantA?.name ?? (thread as any).participantB?.name ?? 'Someone';
    
    await notificationService.createNotification({
      userId: recipientId,
      title: 'New message',
      message: `${(thread as any)[thread.participantAId === senderId ? 'participantA' : 'participantB']?.name ?? 'Someone'} sent you a message.`,
      type: 'DIRECT_MESSAGE',
      link: `/messages?thread=${threadId}`,
    });

    return message;
  }

  /**
   * Fetches paginated messages for a thread (cursor-based, oldest → newest).
   */
  async getMessages(threadId: string, userId: string, cursor?: string, limit = 50) {
    const ok = await this.isParticipant(threadId, userId);
    if (!ok) throw new Error('Unauthorized: you are not a member of this thread.');

    return prisma.directMessage.findMany({
      where: { threadId },
      include: { sender: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: 'asc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  /**
   * Lists all threads for a user with last message preview and unread count.
   */
  async getThreadsForUser(userId: string) {
    const threads = await prisma.directMessageThread.findMany({
      where: {
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      include: {
        participantA: { select: { id: true, name: true, image: true, username: true } },
        participantB: { select: { id: true, name: true, image: true, username: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, name: true } } },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Attach unread count per thread
    const threadIds = threads.map((t) => t.id);
    const unreadCounts = await Promise.all(
      threadIds.map((threadId) =>
        prisma.directMessage.count({
          where: { threadId, senderId: { not: userId }, readAt: null },
        })
      )
    );

    return threads.map((thread, i) => ({
      ...thread,
      unreadCount: unreadCounts[i],
      otherParticipant: thread.participantAId === userId ? thread.participantB : thread.participantA,
    }));
  }

  /**
   * Marks all unread messages from the other participant as read.
   */
  async markThreadRead(threadId: string, userId: string) {
    const ok = await this.isParticipant(threadId, userId);
    if (!ok) throw new Error('Unauthorized.');

    return prisma.directMessage.updateMany({
      where: {
        threadId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }
}

export const dmService = new DmService();
