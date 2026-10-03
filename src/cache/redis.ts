import { Redis } from '@upstash/redis';
import { prisma } from '../lib/prisma';

let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (e) {
  console.warn("Redis initialization failed, falling back to DB only", e);
}

const inflightPromises = new Map<string, Promise<any>>();

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (redis) {
        const data = await redis.get<T>(key);
        if (data) return data;
      }
    } catch (e) {
      console.warn(`Redis get failed for ${key}, falling back to DB`, e);
    }
    
    try {
      const meta = await prisma.cacheMetadata.findUnique({ where: { key } });
      if (meta && (!meta.expiresAt || meta.expiresAt > new Date())) {
        return JSON.parse(meta.value) as T;
      }
    } catch (e) {
      console.error(`DB get failed for ${key}`, e);
    }
    return null;
  },
  
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    
    // Save to DB
    try {
      const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;
      await prisma.cacheMetadata.upsert({
        where: { key },
        update: { value: stringValue, expiresAt },
        create: { key, value: stringValue, expiresAt },
      });
    } catch (e) {
      console.error(`DB set failed for ${key}`, e);
    }

    // Save to Redis
    try {
      if (redis) {
        if (ttlSeconds) {
          await redis.set(key, value, { ex: ttlSeconds });
        } else {
          await redis.set(key, value);
        }
      }
    } catch (e) {
      console.warn(`Redis set failed for ${key}`, e);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await prisma.cacheMetadata.deleteMany({ where: { key } });
    } catch (e) {}
    
    try {
      if (redis) {
        await redis.del(key);
      }
    } catch (e) {}
  },

  async getOrSet<T>(key: string, loader: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    if (inflightPromises.has(key)) {
      return inflightPromises.get(key) as Promise<T>;
    }

    const promise = (async () => {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
      
      const freshData = await loader();
      await this.set(key, freshData, ttlSeconds);
      return freshData;
    })();

    inflightPromises.set(key, promise);
    try {
      return await promise;
    } finally {
      inflightPromises.delete(key);
    }
  }
}
