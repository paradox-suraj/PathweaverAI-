import { redis } from "@/lib/redis";

/**
 * Redis-backed rate limiter for AI API calls.
 * Uses a sliding window counter pattern.
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Check if a user is within their Gemini API call quota.
 * Default: 20 calls per hour per user.
 */
export async function checkGeminiRateLimit(
  userId: string,
  maxRequests = 20,
  windowSeconds = 3600
): Promise<RateLimitResult> {
  const key = `ratelimit:gemini:${userId}`;
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    const ttl = await redis.ttl(key);
    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetInSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  } catch {
    // If Redis is down, allow the request (fail‑open)
    return { allowed: true, remaining: maxRequests, resetInSeconds: windowSeconds };
  }
}

/**
 * Generic rate limiter for any endpoint.
 * @param identifier - Unique key (e.g., userId, IP)
 * @param resource - Resource name (e.g., "chat", "generate")
 * @param maxRequests - Max requests allowed in the window
 * @param windowSeconds - Window duration in seconds
 */
export async function checkRateLimit(
  identifier: string,
  resource: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const key = `ratelimit:${resource}:${identifier}`;
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    const ttl = await redis.ttl(key);
    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetInSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  } catch {
    return { allowed: true, remaining: maxRequests, resetInSeconds: windowSeconds };
  }
}
