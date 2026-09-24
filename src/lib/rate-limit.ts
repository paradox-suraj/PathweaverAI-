import { redis } from "@/lib/redis";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if a given IP has exceeded its rate limit.
   * If not, increments the count.
   * Cleans up expired rate limits automatically.
   */
  async check(ip: string): Promise<{ success: boolean; limit: number; remaining: number; resetAt: Date }> {
    const now = Date.now();
    const redisKey = `ratelimit:${ip}`;
    const windowStart = now - this.config.windowMs;

    const multi = redis.multi();
    multi.zremrangebyscore(redisKey, 0, windowStart);
    multi.zadd(redisKey, now, `${now}-${Math.random()}`);
    multi.zcard(redisKey);
    multi.expire(redisKey, Math.ceil(this.config.windowMs / 1000));

    const results = await multi.exec();
    if (!results) throw new Error("Redis exec failed");
    
    // In ioredis, multi.exec() returns Array<[Error | null, any]>
    const currentRequests = (results[2]?.[1] as number) || 1;

    const remaining = Math.max(0, this.config.maxRequests - currentRequests);
    const success = currentRequests <= this.config.maxRequests;
    const resetAt = new Date(now + this.config.windowMs);

    if (!success) {
      console.warn(`[SECURITY] Rate limit exceeded for IP: ${ip}`);
    }

    return { success, limit: this.config.maxRequests, remaining, resetAt };
  }
}

// Default export of a global instance for AI generation (e.g., 10 per hour)
export const aiRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000 // 1 hour
});
