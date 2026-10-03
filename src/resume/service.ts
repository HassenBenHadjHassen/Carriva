import { prisma } from '../lib/prisma';
import { aiService } from '../ai/service';
import { cacheService } from '../cache/redis';
import { TEMPLATE_VERSION, PROMPT_VERSION } from '../config/constants';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

export class ResumeService {
  async generateTailoredResumeData(applicationId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { profile: true, job: true }
    });

    if (!application) throw new Error("Application not found");

    const modelName = process.env.AI_MODEL || 'default-model';
    const profileVersion = application.profile.version;
    const jobHash = application.job.hash;
    
    // Deterministic cache key
    const cacheKey = `resume:${profileVersion}:${jobHash}:${TEMPLATE_VERSION}:${modelName}:${PROMPT_VERSION}:en`;

    // Deduplication check in DB
    const existingGeneration = await prisma.generatedResume.findFirst({
      where: { applicationId, templateVersion: TEMPLATE_VERSION, modelVersion: modelName }
    });

    if (existingGeneration) {
      return existingGeneration;
    }

    // Call AI Service (orchestration handled by aiService, caching by getOrSet)
    const tailoredData = await cacheService.getOrSet(cacheKey, async () => {
      return await aiService.generateTailoredResume(application.profile, application.job);
    }, 60 * 60 * 24 * 7); // 7 days

    const generated = await prisma.generatedResume.create({
      data: {
        applicationId,
        templateVersion: TEMPLATE_VERSION,
        modelVersion: modelName,
        content: JSON.stringify(tailoredData),
        htmlContent: null
      }
    });

    return generated;
  }

  async renderResumeHtml(applicationId: string, templateId: string) {
    const generated = await prisma.generatedResume.findFirst({
      where: { applicationId },
      orderBy: { createdAt: 'desc' }
    });

    if (!generated) throw new Error("No generated resume found for this application");

    // Check cache for HTML
    const cacheKey = `html:${generated.id}:${TEMPLATE_VERSION}`;
    if (generated.htmlContent) {
      return generated.htmlContent;
    }

    const htmlContent = await cacheService.getOrSet(cacheKey, async () => {
      const content = JSON.parse(generated.content);
      const templatePath = path.join(process.cwd(), 'template', 'index.html');
      const rawHtml = await fs.readFile(templatePath, 'utf-8');
      
      const $ = cheerio.load(rawHtml);

      // Inject Summary
      if (content.summary) {
        $('.profile-text').text(content.summary);
      }

      // Inject Skills (Core Stack as example)
      if (content.selectedSkills && content.selectedSkills.length > 0) {
        const badgesHtml = content.selectedSkills.map((s: string) => `<span class="skill-badge">${s}</span>`).join('');
        $('.skill-group--primary .skill-badges').html(badgesHtml);
      }

      // We preserve the rest of the template for the MVP, but would ideally dynamically replace experiences based on ID mapping
      // If we have time, we can map `content.experience` to `.experience` blocks

      return $.html();
    }, 60 * 60 * 24 * 30); // 30 days

    // Save back to DB
    await prisma.generatedResume.update({
      where: { id: generated.id },
      data: { htmlContent }
    });

    return htmlContent;
  }
}

export const resumeService = new ResumeService();
