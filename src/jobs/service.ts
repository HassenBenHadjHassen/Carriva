import { aiService } from '../ai/service';
import { getActiveModelName } from '../ai/config';
import { cacheService } from '../cache/redis';
import { cacheKeys } from '../cache/keys';
import { prisma } from '../lib/prisma';
import { SCHEMA_VERSION, PROMPT_VERSION } from '../config/constants';
import crypto from 'crypto';

export class JobsService {
  /**
   * Normalizes a job description to remove superficial differences.
   */
  private normalizeJobDescription(text: string): string {
    return text
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\n+/g, '\n') // Collapse multiple newlines
      .replace(/[ \t]+/g, ' ') // Collapse multiple spaces
      .toLowerCase();
  }

  /**
   * Analyzes a raw job description, deduplicates, and extracts structured requirements.
   */
  async analyzeJobDescription(userId: string, descriptionText: string) {
    const normalized = this.normalizeJobDescription(descriptionText);
    const normalizedHash = crypto.createHash('sha256').update(normalized).digest('hex');
    const modelName = getActiveModelName();
    const cacheKey = cacheKeys.job(normalizedHash, modelName);

    // Deduplication check: See if this exact job description has been analyzed already
    const existingJob = await prisma.job.findFirst({
      where: { hash: normalizedHash },
      include: { requirements: true }
    });

    if (existingJob) {
      console.log(`[JobsService] Exact job already exists. Reusing Job ID: ${existingJob.id}`);
      return existingJob;
    }

    // Call AI Service (orchestration handled by cacheService getOrSet)
    const jobData = await cacheService.getOrSet(cacheKey, async () => {
      console.log(`[JobsService] Extracting Job Description with AI...`);
      return await aiService.extractJob(userId, descriptionText);
    }, 60 * 60 * 24 * 30); // 30 days

    // Save Job and its Requirements to Prisma, handling concurrency gracefully
    try {
      const job = await prisma.job.create({
        data: {
          title: jobData.title,
          company: jobData.company,
          description: descriptionText,
          hash: normalizedHash,
          requirements: {
            create: (jobData.requirements || []).map((req: { skill: string, isMandatory: boolean }) => ({
              rawRequirement: req.skill,
              isMandatory: req.isMandatory
            }))
          }
        },
        include: {
          requirements: true
        }
      });
      return job;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
        console.log(`[JobsService] Job was concurrently created. Reusing existing job.`);
        const concurrentJob = await prisma.job.findUnique({
          where: { hash: normalizedHash },
          include: { requirements: true }
        });
        if (concurrentJob) return concurrentJob;
      }
      throw error;
    }
  }

  async getJob(jobId: string) {
    return prisma.job.findUnique({
      where: { id: jobId },
      include: { requirements: true }
    });
  }
}

export const jobsService = new JobsService();
