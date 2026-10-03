import { aiService } from '../ai/service';
import { JobExtractionType } from '../ai/schemas';
import { cacheService } from '../cache/redis';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

export class JobsService {
  /**
   * Analyzes a raw job description and extracts structured requirements.
   */
  async analyzeJobDescription(userId: string, descriptionText: string) {
    const textHash = crypto.createHash('sha256').update(descriptionText).digest('hex');
    const cacheKey = `job:${textHash}:v1`;

    let jobData = await cacheService.get<JobExtractionType>(cacheKey);

    if (!jobData) {
      console.log(`[JobsService] Cache miss for Job Description. Extracting with AI...`);
      jobData = await aiService.extractJob(descriptionText);
      await cacheService.set(cacheKey, jobData, 60 * 60 * 24 * 7); // Cache for 7 days
    } else {
      console.log(`[JobsService] Cache hit for Job extraction.`);
    }

    // Save Job and its Requirements to Prisma
    const job = await prisma.job.create({
      data: {
        userId,
        title: jobData.title,
        company: jobData.company,
        description: descriptionText,
        hash: textHash,
        requirements: {
          create: (jobData.requirements || []).map((req) => ({
            rawRequirement: req.skill,
            isMandatory: req.isMandatory
          }))
        }
      },
      include: {
        requirements: true
      }
    });

    // We can also opportunistically link skills if we want, but we'll leave that to matching
    return job;
  }

  async getJob(jobId: string) {
    return prisma.job.findUnique({
      where: { id: jobId },
      include: { requirements: true }
    });
  }
}

export const jobsService = new JobsService();
