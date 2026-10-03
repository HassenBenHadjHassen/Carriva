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
      include: { profile: { include: { user: true } }, job: true }
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

    const { user, ...profileWithoutUser } = application.profile as typeof application.profile & { user: { name: string | null; email: string; phone: string | null; website: string | null; github: string | null; linkedin: string | null; location: string | null } };
    const userContactInfo = {
      name:     user.name     || undefined,
      email:    user.email    || undefined,
      phone:    user.phone    || undefined,
      website:  user.website  || undefined,
      github:   user.github   || undefined,
      linkedin: user.linkedin || undefined,
      location: user.location || undefined,
    };

    const coverLetterData = await cacheService.getOrSet(cacheKey, async () => {
      return await aiService.generateCoverLetter(application.userId, { ...profileWithoutUser, userContactInfo }, application.job);
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

    // Fetch user contact info to replace any AI-generated placeholders
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { profile: { include: { user: true } } }
    });
    const user = application?.profile?.user;

    let content = generated.content;

    // Replace common placeholder patterns the AI emits when it doesn't know the real value
    if (user) {
      const contactBlock = [
        user.phone,
        user.email,
        user.website,
        user.linkedin,
        user.location,
      ].filter(Boolean).join(' | ');

      if (user.name) {
        content = content
          .replace(/\[Your (?:Full )?Name\]/gi, user.name)
          .replace(/\[Candidate(?:'s)? Name\]/gi, user.name)
          .replace(/Sincerely,[\s\S]*?\n\n?\[.*?\]/g, `Sincerely,\n\n${user.name}`);
      }
      if (contactBlock) {
        content = content
          .replace(/\[Your Contact Information\]/gi, contactBlock)
          .replace(/\[Contact Information\]/gi, contactBlock);
      }
    }

    const $ = await import('cheerio').then(m => m.load('<div style="font-family: \'Inter\', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; font-size: 14px; color: #333;"></div>'));
    
    const lines = content.split(/\n+/);
    lines.forEach(line => {
      if (line.trim()) {
        $('div').append($('<p style="margin-bottom: 1em;"></p>').text(line.trim()));
      }
    });

    return $.html();
  }
}

export const coverLetterService = new CoverLetterService();
