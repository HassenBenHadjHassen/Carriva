import { redis } from '../cache/redis';

export async function checkRateLimit(key: string, limit: number, windowSecs: number) {
  if (!redis) return; // gracefully bypass if no redis

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSecs);
  }
  if (current > limit) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }
}
