import { prisma } from '../lib/prisma';
import { aiService } from '../ai/service';
import { getActiveModelName } from '../ai/config';
import { cacheService } from '../cache/redis';
import { cacheKeys } from '../cache/keys';
import { PROMPT_VERSION } from '../config/constants';

export class CoverLetterService {
  async generateTailoredCoverLetter(applicationId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { profile: true, job: true }
    });

    if (!application) throw new Error("Application not found");

    const modelName = getActiveModelName();
    const profileVersion = application.profile.version;
    const jobHash = application.job.hash;
    
    // Deterministic cache key
    const cacheKey = cacheKeys.coverLetterGeneration(application.userId, application.profileId, profileVersion, jobHash, modelName);

    // Deduplication check in DB
    const existingGeneration = await prisma.generatedCoverLetter.findFirst({
      where: { applicationId, modelVersion: modelName, profileVersion, promptVersion: PROMPT_VERSION }
    });

    if (existingGeneration) {
      return existingGeneration;
    }

    const coverLetterData = await cacheService.getOrSet(cacheKey, async () => {
      return await aiService.generateCoverLetter(application.userId, application.profile, application.job);
    }, 60 * 60 * 24 * 7); // 7 days

    const generated = await prisma.generatedCoverLetter.create({
      data: {
        applicationId,
        modelVersion: modelName,
        profileVersion,
        promptVersion: PROMPT_VERSION,
        content: coverLetterData.content,
      }
    });

    return generated;
  }

  async renderCoverLetterHtml(applicationId: string) {
    const generated = await prisma.generatedCoverLetter.findFirst({
      where: { applicationId },
      orderBy: { createdAt: 'desc' }
    });

    if (!generated) throw new Error("No generated cover letter found for this application");

    const $ = await import('cheerio').then(m => m.load('<div style="font-family: \'Inter\', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; font-size: 14px; color: #333;"></div>'));
    
    const lines = generated.content.split(/\n+/);
    lines.forEach(line => {
      if (line.trim()) {
        $('div').append($('<p style="margin-bottom: 1em;"></p>').text(line.trim()));
      }
    });

    return $.html();
  }
}

export const coverLetterService = new CoverLetterService();
