import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

// Check if REDIS_URL is available
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = globalForRedis.redis ?? new Redis(redisUrl, {
  // Retry strategy for resilient connections
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null,
});

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}
