import { prisma } from "@/lib/prisma";

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
    const now = new Date();
    
    // First, try to fetch the current rate limit for this IP
    const record = await prisma.rateLimit.findUnique({
      where: { ip }
    });

    if (!record) {
      // No record exists, create one
      const resetAt = new Date(now.getTime() + this.config.windowMs);
      await prisma.rateLimit.create({
        data: {
          ip,
          count: 1,
          resetAt
        }
      });
      return { success: true, limit: this.config.maxRequests, remaining: this.config.maxRequests - 1, resetAt };
    }

    if (now > record.resetAt) {
      // Window expired, reset it
      const resetAt = new Date(now.getTime() + this.config.windowMs);
      await prisma.rateLimit.update({
        where: { ip },
        data: {
          count: 1,
          resetAt
        }
      });
      return { success: true, limit: this.config.maxRequests, remaining: this.config.maxRequests - 1, resetAt };
    }

    if (record.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return { success: false, limit: this.config.maxRequests, remaining: 0, resetAt: record.resetAt };
    }

    // Increment count
    const updated = await prisma.rateLimit.update({
      where: { ip },
      data: {
        count: { increment: 1 }
      }
    });

    return { 
      success: true, 
      limit: this.config.maxRequests, 
      remaining: this.config.maxRequests - updated.count, 
      resetAt: updated.resetAt 
    };
  }
}

// Default export of a global instance for AI generation (e.g., 10 per hour)
export const aiRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000 // 1 hour
});
