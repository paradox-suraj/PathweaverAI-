import { redis } from './redis';

export type WatchPartyState = {
  id: string;
  courseId: string;
  hostId: string;
  currentVideoId: string | null;
  currentVideoTime: number;
  isPlaying: boolean;
  updatedAt: number;
};

export type WatchPartyMessage = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: number;
};

export type WatchPartyReaction = {
  id: string;
  emoji: string;
  userId: string;
  createdAt: number;
};

const PARTY_PREFIX = 'watch-party:';

export async function createWatchParty(
  id: string,
  courseId: string,
  hostId: string
): Promise<WatchPartyState> {
  const state: WatchPartyState = {
    id,
    courseId,
    hostId,
    currentVideoId: null,
    currentVideoTime: 0,
    isPlaying: false,
    updatedAt: Date.now(),
  };

  await redis.set(`${PARTY_PREFIX}${id}`, JSON.stringify(state));
  // Set expiry for 24 hours
  await redis.expire(`${PARTY_PREFIX}${id}`, 60 * 60 * 24);

  return state;
}

export async function getWatchPartyState(
  id: string
): Promise<WatchPartyState | null> {
  const data = await redis.get(`${PARTY_PREFIX}${id}`);
  if (!data) return null;
  return JSON.parse(data) as WatchPartyState;
}

export async function updateWatchPartyState(
  id: string,
  updates: Partial<WatchPartyState>
): Promise<WatchPartyState | null> {
  const state = await getWatchPartyState(id);
  if (!state) return null;

  const newState = {
    ...state,
    ...updates,
    updatedAt: Date.now(),
  };

  await redis.set(`${PARTY_PREFIX}${id}`, JSON.stringify(newState));
  // Reset expiry
  await redis.expire(`${PARTY_PREFIX}${id}`, 60 * 60 * 24);

  return newState;
}

export async function deleteWatchParty(id: string): Promise<void> {
  await redis.del(`${PARTY_PREFIX}${id}`);
  await redis.del(`${PARTY_PREFIX}${id}:participants`);
  await redis.del(`${PARTY_PREFIX}${id}:messages`);
  await redis.del(`${PARTY_PREFIX}${id}:reactions`);
}

export async function joinWatchParty(id: string, userId: string): Promise<void> {
  await redis.sadd(`${PARTY_PREFIX}${id}:participants`, userId);
  await redis.expire(`${PARTY_PREFIX}${id}:participants`, 60 * 60 * 24);
}

export async function getParticipants(id: string): Promise<string[]> {
  return redis.smembers(`${PARTY_PREFIX}${id}:participants`);
}

export async function addMessage(
  id: string,
  userId: string,
  userName: string,
  content: string
): Promise<WatchPartyMessage> {
  const message: WatchPartyMessage = {
    id: crypto.randomUUID(),
    userId,
    userName,
    content,
    createdAt: Date.now(),
  };

  await redis.rpush(`${PARTY_PREFIX}${id}:messages`, JSON.stringify(message));
  // Expire messages after 5 minutes (300 seconds)
  await redis.expire(`${PARTY_PREFIX}${id}:messages`, 300);
  return message;
}

export async function getMessages(
  id: string,
  start = 0,
  end = -1
): Promise<WatchPartyMessage[]> {
  const data = await redis.lrange(`${PARTY_PREFIX}${id}:messages`, start, end);
  return data.map((msg) => JSON.parse(msg) as WatchPartyMessage);
}

export async function addReaction(
  id: string,
  userId: string,
  emoji: string
): Promise<WatchPartyReaction> {
  const reaction: WatchPartyReaction = {
    id: crypto.randomUUID(),
    emoji,
    userId,
    createdAt: Date.now(),
  };

  await redis.rpush(`${PARTY_PREFIX}${id}:reactions`, JSON.stringify(reaction));
  // Keep reactions very short-lived (e.g., 10 seconds)
  await redis.expire(`${PARTY_PREFIX}${id}:reactions`, 10);
  return reaction;
}

export async function getReactions(
  id: string,
  start = 0,
  end = -1
): Promise<WatchPartyReaction[]> {
  const data = await redis.lrange(`${PARTY_PREFIX}${id}:reactions`, start, end);
  return data.map((r) => JSON.parse(r) as WatchPartyReaction);
}
