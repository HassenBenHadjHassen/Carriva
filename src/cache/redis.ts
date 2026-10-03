import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get<T>(key);
    return data || null;
  },
  
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    } else {
      await redis.set(key, value);
    }
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  }
}
