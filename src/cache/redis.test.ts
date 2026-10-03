import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cacheService } from './redis';
import { prisma } from '../lib/prisma';

// Mock dependencies
vi.mock('../lib/prisma', () => ({
  prisma: {
    cacheMetadata: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    }
  }
}));

describe('Cache Service Request Coalescing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should coalesce multiple getOrSet calls for the same key', async () => {
    const key = 'test-coalesce-key';
    let fetchCount = 0;

    const slowFetch = async () => {
      fetchCount++;
      return new Promise((resolve) => setTimeout(() => resolve('data'), 100));
    };

    // Run getOrSet multiple times concurrently
    const promises = [
      cacheService.getOrSet(key, slowFetch),
      cacheService.getOrSet(key, slowFetch),
      cacheService.getOrSet(key, slowFetch),
    ];

    const results = await Promise.all(promises);

    // All should get the same data
    expect(results).toEqual(['data', 'data', 'data']);

    // Fetch should only be called once
    expect(fetchCount).toBe(1);
  });
});
