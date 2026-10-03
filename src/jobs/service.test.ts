import { describe, it, expect, vi } from 'vitest';
import { jobsService } from './service';
import { prisma } from '../lib/prisma';
import { aiService } from '../ai/service';

vi.mock('../lib/prisma', () => ({
  prisma: {
    job: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn()
    }
  }
}));

vi.mock('../ai/service', () => ({
  aiService: {
    extractJob: vi.fn()
  }
}));

vi.mock('../cache/redis', () => ({
  cacheService: {
    getOrSet: vi.fn(async (key, fn) => fn())
  }
}));

describe('JobsService Security & Deduplication', () => {
  it('should reuse existing job if hash matches', async () => {
    const existingJob = { id: 'job-1', hash: 'testhash' };
    vi.mocked(prisma.job.findFirst).mockResolvedValueOnce(existingJob as any);
    
    const job = await jobsService.analyzeJobDescription('user-1', 'Description');
    expect(job).toEqual(existingJob);
    expect(prisma.job.create).not.toHaveBeenCalled();
  });

  it('should handle concurrent job creation (P2002)', async () => {
    vi.mocked(prisma.job.findFirst).mockResolvedValueOnce(null);
    vi.mocked(aiService.extractJob).mockResolvedValueOnce({
      title: 'Title', company: 'Company', requirements: []
    });

    const p2002Error = new Error('Unique constraint failed');
    (p2002Error as any).code = 'P2002';
    
    vi.mocked(prisma.job.create).mockRejectedValueOnce(p2002Error);
    
    const concurrentJob = { id: 'job-concurrent' };
    vi.mocked(prisma.job.findUnique).mockResolvedValueOnce(concurrentJob as any);
    
    const job = await jobsService.analyzeJobDescription('user-1', 'Description');
    expect(job).toEqual(concurrentJob);
  });
});
