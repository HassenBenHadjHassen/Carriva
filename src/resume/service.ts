import { prisma } from '../lib/prisma';
import { aiService } from '../ai/service';
import { getActiveModelName } from '../ai/config';
import { cacheService } from '../cache/redis';
import { cacheKeys } from '../cache/keys';
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

      const templatePath = path.join(process.cwd(), 'template', 'index.html');
      const rawHtml = await fs.readFile(templatePath, 'utf-8');
      
      const $ = cheerio.load(rawHtml);

      const formatDate = (date: string | Date | null | undefined, isFr: boolean): string => {
        if (!date || date === 'null') return isFr ? 'Présent' : 'Present';
        const d = new Date(date);
        if (isNaN(d.getTime())) return String(date);
        const formatter = new Intl.DateTimeFormat(isFr ? 'fr-FR' : 'en-US', { month: 'short', year: 'numeric' });
        const formatted = formatter.format(d);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
      };

      const populateSection = (sectionId: string, isFr: boolean) => {
        const section = $(sectionId);
        if (!section.length) return;

        // Clear existing personal fields
        section.find('header.hero h1').empty();
        const contactList = section.find('.contact-list');
        contactList.find('li').eq(0).find('a').empty().removeAttr('href');
        contactList.find('li').eq(1).find('a').empty().removeAttr('href');
        contactList.find('li').eq(2).find('a').empty().removeAttr('href');
        contactList.find('li').eq(3).find('a').empty().removeAttr('href');
        contactList.find('li').eq(4).find('a').empty().removeAttr('href');
        contactList.find('li.contact-availability').empty();

        // Header / Personal Info
        if (profile.user.name) {
          section.find('header.hero h1').text(profile.user.name);
        }
        
        if (profile.user.email) {
          contactList.find('li').eq(0).find('a').text(profile.user.email).attr('href', `mailto:${profile.user.email}`);
        } else {
          contactList.find('li').eq(0).css('display', 'none');
        }
        if (profile.user.phone) {
          contactList.find('li').eq(1).find('a').text(profile.user.phone).attr('href', `tel:${profile.user.phone.replace(/\\s/g, '')}`);
          contactList.find('li').eq(1).css('display', '');
        } else {
          contactList.find('li').eq(1).css('display', 'none');
        }
        if (profile.user.website) {
          contactList.find('li').eq(2).find('a').text(profile.user.website).attr('href', profile.user.website);
          contactList.find('li').eq(2).css('display', '');
        } else {
          contactList.find('li').eq(2).css('display', 'none');
        }
        if (profile.user.github) {
          contactList.find('li').eq(3).find('a').text(profile.user.github).attr('href', profile.user.github);
          contactList.find('li').eq(3).css('display', '');
        } else {
          contactList.find('li').eq(3).css('display', 'none');
        }
        if (profile.user.linkedin) {
          contactList.find('li').eq(4).find('a').text(profile.user.linkedin).attr('href', profile.user.linkedin);
          contactList.find('li').eq(4).css('display', '');
        } else {
          contactList.find('li').eq(4).css('display', 'none');
        }
        if (profile.user.location) {
          contactList.find('li.contact-availability').text(profile.user.location).css('display', '');
        } else {
          contactList.find('li.contact-availability').css('display', 'none');
        }

        // Inject Summary
        if (content.summary) {
          section.find('.profile-text').text(content.summary);
        }

        // Inject Skills
        if (content.selectedSkills && content.selectedSkills.length > 0) {
          const badgesContainer = section.find('.skill-group--primary .skill-badges');
          badgesContainer.empty();
          content.selectedSkills.forEach((s: string) => {
            badgesContainer.append($('<span class="skill-badge"></span>').text(s));
          });
        }

        // Experiences
        const experienceContainer = section.find('.experience-section');
        experienceContainer.find('article.experience').remove(); // Clear template experiences
        
        const orderedExperiences = profile.experiences.slice().sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());
        
        for (const exp of orderedExperiences) {
          const tailoredExp = content.experience?.find((e: { experienceId: string, bullets: string[] }) => e.experienceId === exp.id);
          const bulletsToUse = tailoredExp ? tailoredExp.bullets : exp.bullets;
          
          const article = $('<article class="experience"></article>');
          const header = $('<div class="exp-header"></div>');
          const titleRow = $('<div class="exp-title-row"></div>');
          
          titleRow.append($('<h3 class="exp-role"></h3>').text(exp.role));
          titleRow.append($('<span class="exp-period"></span>').text(`${formatDate(exp.startDate, isFr)} - ${formatDate(exp.endDate, isFr)}`));
          
          header.append(titleRow);
          header.append($('<span class="exp-company"></span>').text(exp.company));
          
          article.append(header);
          
          const ul = $('<ul class="exp-bullets"></ul>');
          bulletsToUse.forEach((b: string) => {
            ul.append($('<li></li>').text(b));
          });
          article.append(ul);
          
          experienceContainer.append(article);
        }

        // Educations
        const eduContainer = section.find('aside.sidebar .side-block:last-child');
        eduContainer.find('.edu-item').remove();
        for (const edu of profile.educations) {
          const eduDiv = $('<div class="edu-item"></div>');
          const title = edu.field ? (isFr ? `${edu.degree} en ${edu.field}` : `${edu.degree} in ${edu.field}`) : edu.degree;
          eduDiv.append($('<strong></strong>').text(title));
          eduDiv.append($('<span></span>').text(`${edu.institution} · ${formatDate(edu.startDate, isFr)} - ${formatDate(edu.endDate, isFr)}`));
          eduContainer.append(eduDiv);
        }

        // Projects
        const projectContainer = section.find('.project-list');
        projectContainer.empty();
        
        const selectedProjects = profile.projects.filter(p => content.selectedProjects?.includes(p.id))
        const projectsToRender = selectedProjects.length > 0 ? selectedProjects : profile.projects;
        
        for (const proj of projectsToRender) {
          const stackStr = proj.technologies.join(' · ');
          const article = $('<article class="project-item"></article>');
          
          const left = $('<div class="project-left"></div>');
          left.append($('<h3 class="project-name"></h3>').text(proj.name));
          
          const right = $('<div class="project-right"></div>');
          right.append($('<p class="project-desc"></p>').text(proj.description || ''));
          right.append($('<div class="project-stack"></div>').text(stackStr));
          
          article.append(left);
          article.append(right);
          
          projectContainer.append(article);
        }
      };

      populateSection('#cv-en', false);
      populateSection('#cv-fr', true);

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
