import { prisma } from '../lib/prisma';
import { aiService, getActiveModelName } from '../ai/service';
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

    const modelName = getActiveModelName();
    const profileVersion = application.profile.version;
    const jobHash = application.job.hash;
    
    // Deterministic cache key
    const cacheKey = `resume:${application.userId}:${application.profileId}:${profileVersion}:${jobHash}:${TEMPLATE_VERSION}:${modelName}:${PROMPT_VERSION}:en`;

    // Deduplication check in DB
    const existingGeneration = await prisma.generatedResume.findFirst({
      where: { applicationId, templateVersion: TEMPLATE_VERSION, modelVersion: modelName }
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
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { profile: { include: { experiences: true, educations: true, projects: true, user: true } } }
      });
      const profile = application!.profile;
      
      const templatePath = path.join(process.cwd(), 'template', 'index.html');
      const rawHtml = await fs.readFile(templatePath, 'utf-8');
      
      const $ = cheerio.load(rawHtml);

      const sectionEn = $('#cv-en');

      // Header / Personal Info
      if (profile.user.name) {
        sectionEn.find('header.hero h1').text(profile.user.name);
      }
      if (profile.user.email) {
        sectionEn.find('.contact-list li:first-child a').text(profile.user.email).attr('href', `mailto:${profile.user.email}`);
      }

      // Inject Summary
      if (content.summary) {
        sectionEn.find('.profile-text').text(content.summary);
      }

      // Inject Skills
      if (content.selectedSkills && content.selectedSkills.length > 0) {
        const badgesHtml = content.selectedSkills.map((s: string) => `<span class="skill-badge">${s}</span>`).join('');
        sectionEn.find('.skill-group--primary .skill-badges').html(badgesHtml);
      }

      // Experiences
      const experienceContainer = sectionEn.find('.section:nth-of-type(2)');
      experienceContainer.find('article.experience').remove(); // Clear template experiences
      
      const orderedExperiences = profile.experiences.slice().sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());
      
      for (const exp of orderedExperiences) {
        // Find tailored bullets if they exist
        const tailoredExp = content.experience?.find((e: any) => e.experienceId === exp.id);
        const bulletsToUse = tailoredExp ? tailoredExp.bullets : exp.bullets;
        
        const bulletsHtml = bulletsToUse.map((b: string) => `<li>${b}</li>`).join('');
        const expHtml = `
        <article class="experience">
          <div class="exp-header">
            <div class="exp-title-row">
              <h3 class="exp-role">${exp.role}</h3>
              <span class="exp-period">${exp.startDate} - ${exp.endDate || 'Present'}</span>
            </div>
            <span class="exp-company">${exp.company}</span>
          </div>
          <ul class="exp-bullets">
            ${bulletsHtml}
          </ul>
        </article>`;
        experienceContainer.append(expHtml);
      }

      // Educations
      const eduContainer = sectionEn.find('aside.sidebar .side-block:last-child');
      eduContainer.find('.edu-item').remove();
      for (const edu of profile.educations) {
        const eduHtml = `
        <div class="edu-item">
          <strong>${edu.degree} in ${edu.field}</strong>
          <span>${edu.institution} · ${edu.startDate} - ${edu.endDate || 'Present'}</span>
        </div>`;
        eduContainer.append(eduHtml);
      }

      // Projects
      const projectContainer = sectionEn.find('.project-list');
      projectContainer.empty();
      
      const selectedProjects = profile.projects.filter(p => content.selectedProjects?.includes(p.id))
      const projectsToRender = selectedProjects.length > 0 ? selectedProjects : profile.projects;
      
      for (const proj of projectsToRender) {
        const stackStr = proj.technologies.join(' · ');
        const projHtml = `
        <article class="project-item">
          <div class="project-left">
            <h3 class="project-name">${proj.name}</h3>
          </div>
          <div class="project-right">
            <p class="project-desc">${proj.description || ''}</p>
            <div class="project-stack">${stackStr}</div>
          </div>
        </article>`;
        projectContainer.append(projHtml);
      }

      const cssPath = path.join(process.cwd(), 'template', 'styles.css');
      const cssContent = await fs.readFile(cssPath, 'utf-8');
      $('head').append(`<style>${cssContent}</style>`);
      $('link[href="styles.css"]').remove();

      // Inline images
      $('img').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.startsWith('assets/')) {
          try {
            const imgPath = path.join(process.cwd(), 'template', src);
            const imgData = require('fs').readFileSync(imgPath);
            const ext = path.extname(src).substring(1);
            const base64 = imgData.toString('base64');
            $(el).attr('src', `data:image/${ext};base64,${base64}`);
          } catch (e) {
             console.error("Failed to inline image", src);
          }
        }
      });

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
