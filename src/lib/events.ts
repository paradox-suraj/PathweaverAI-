import { EventEmitter } from "events";
import { redis } from "./redis";

// Ensure a single instance across hot reloads in development
const globalForEvents = globalThis as unknown as {
  eventManager: EventEmitter | undefined;
  pubClient: typeof redis | undefined;
  subClient: typeof redis | undefined;
  isSubscribed: boolean;
};

export const eventManager = globalForEvents.eventManager ?? new EventEmitter();
eventManager.setMaxListeners(100);

const pubClient = globalForEvents.pubClient ?? redis.duplicate();
const subClient = globalForEvents.subClient ?? redis.duplicate();

if (process.env.NODE_ENV !== "production") {
  globalForEvents.eventManager = eventManager;
  globalForEvents.pubClient = pubClient;
  globalForEvents.subClient = subClient;
}

// Set up Redis Pub/Sub bridge to support horizontal scaling for SSE
if (!globalForEvents.isSubscribed && process.env.NODE_ENV !== "test") {
  globalForEvents.isSubscribed = true;
  
  subClient.psubscribe('event:*', (err) => {
    if (err) console.error("Failed to subscribe to Redis events:", err);
  });

  subClient.on('pmessage', (pattern, channel, message) => {
    const eventName = channel.replace('event:', '');
    try {
      const data = JSON.parse(message);
      // Call original emit to broadcast to local listeners without looping
      EventEmitter.prototype.emit.call(eventManager, eventName, data);
    } catch (e) {
      console.error("Failed to parse Redis message", e);
    }
  });
}

// Override emit to publish to Redis
const originalEmit = eventManager.emit.bind(eventManager);
eventManager.emit = (eventName: string | symbol, data: any) => {
  if (process.env.NODE_ENV === "test") {
    // In tests, just use local emit
    return originalEmit(eventName, data);
  }
  
  const channel = `event:${String(eventName)}`;
  pubClient.publish(channel, JSON.stringify(data)).catch(console.error);
  return true;
};

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
