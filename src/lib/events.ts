import { EventEmitter } from "events";

// Ensure a single instance across hot reloads in development
const globalForEvents = globalThis as unknown as {
  eventManager: EventEmitter | undefined;
};

export const eventManager = globalForEvents.eventManager ?? new EventEmitter();
eventManager.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") {
  globalForEvents.eventManager = eventManager;
}

export type NotificationEvent = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
};

export type CommunityCoursePublishedEvent = {
  id: string;
  title: string;
  description: string;
  rating: number;
  ratingCount: number;
  enrollmentCount: number;
  user: {
    name: string | null;
    image: string | null;
  };
};

export function emitNotification(notification: NotificationEvent) {
  eventManager.emit(`notification:${notification.userId}`, notification);
}

export function emitCommunityCourse(course: CommunityCoursePublishedEvent) {
  eventManager.emit("community:course_published", course);
}
