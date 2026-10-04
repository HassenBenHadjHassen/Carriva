import { prisma } from '../lib/prisma';
import { aiService } from '../ai/service';
import { getActiveModelName } from '../ai/config';
import { cacheService } from '../cache/redis';
import { cacheKeys } from '../cache/keys';
import { TEMPLATE_VERSION, PROMPT_VERSION } from '../config/constants';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { ResumeTemplate } from '../components/ResumeTemplate';
import fs from 'fs/promises';
import path from 'path';

export class ResumeService {
  async generateTailoredResumeData(applicationId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { profile: true, job: true }
    });

    if (!application) throw new Error("Application not found");

    const modelName = getActiveModelName();
    const profileVersion = application.profile.version;
    const jobHash = application.job.hash;
    
    // Deterministic cache key
    const cacheKey = cacheKeys.resumeGeneration(application.userId, application.profileId, profileVersion, jobHash, modelName);

    // Deduplication check in DB
    const existingGeneration = await prisma.generatedResume.findFirst({
      where: { applicationId, templateVersion: TEMPLATE_VERSION, modelVersion: modelName, profileVersion, promptVersion: PROMPT_VERSION }
    });

    if (existingGeneration) {
      return existingGeneration;
    }

    // Call AI Service (orchestration handled by aiService, caching by getOrSet)
    const tailoredData = await cacheService.getOrSet(cacheKey, async () => {
      return await aiService.generateTailoredResume(application.userId, application.profile, application.job);
    }, 60 * 60 * 24 * 7); // 7 days

    const generated = await prisma.generatedResume.create({
      data: {
        applicationId,
        templateVersion: TEMPLATE_VERSION,
        modelVersion: modelName,
        profileVersion,
        promptVersion: PROMPT_VERSION,
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

    // Fetch application + user now so we can key the cache on user.updatedAt.
    // This ensures any profile change (phone, linkedin, etc.) busts the HTML cache.
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { profile: { include: { experiences: true, educations: true, projects: true, user: true } } }
    });
    if (!application) throw new Error("Application not found");
    const profile = application.profile;

    const cacheKey = cacheKeys.htmlRender(generated.id, profile.user.updatedAt);

      const htmlContent = await cacheService.getOrSet(cacheKey, async () => {
      const content = JSON.parse(generated.content);
      const cssPath = path.join(process.cwd(), 'template', 'styles.css');
      const cssContent = await fs.readFile(cssPath, 'utf-8');
      
      let imageBase64 = '';
      try {
        if (profile.user.image) {
          // Construct path from public dir since image URL is typically /avatars/filename.png
          const publicPath = path.join(process.cwd(), 'public');
          // Removing leading slash for path.join safely
          const relPath = profile.user.image.startsWith('/') ? profile.user.image.substring(1) : profile.user.image;
          const imgPath = path.join(publicPath, relPath);
          const imgData = await fs.readFile(imgPath);
          
          // ResumeTemplate expects only the base64 payload, not the full data URI
          imageBase64 = imgData.toString('base64');
        }
      } catch (e) {
        // Image is optional
      }
      
      const markup = ReactDOMServer.renderToStaticMarkup(
        React.createElement(ResumeTemplate, {
          profile,
          content,
          cssContent,
          imageBase64,
          lang: 'both' // Default for now
        })
      );
      
      return '<!DOCTYPE html>' + markup;
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
