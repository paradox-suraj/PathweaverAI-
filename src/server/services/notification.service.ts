import { prisma } from "@/lib/prisma";
import { emitNotification } from "@/lib/events";

export const notificationService = {
  /**
   * Fetch user notifications
   */
  async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.update({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  },

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  /**
   * Create a new notification
   */
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    link?: string;
  }) {
    const newNotification = await prisma.notification.create({
      data,
    });
    
    // Broadcast via SSE
    emitNotification(newNotification);
    
    return newNotification;
  },
};
