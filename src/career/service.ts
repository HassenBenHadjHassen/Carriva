import { aiService } from '../ai/service';
import { getActiveModelName } from '../ai/config';
import { ResumeProfileType } from '../ai/schemas';
import { cacheService } from '../cache/redis';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

export class CareerService {
  /**
   * Processes a raw CV text and extracts a structured career profile.
   */
  async extractProfileFromCV(userId: string, filename: string, cvText: string) {
    const textHash = crypto.createHash('sha256').update(cvText).digest('hex');
    const { SCHEMA_VERSION, PROMPT_VERSION } = await import('../config/constants');
    const modelName = getActiveModelName();
    const cacheKey = `cv:${userId}:${textHash}:${SCHEMA_VERSION}:${PROMPT_VERSION}:${modelName}`;

    // 1. Check cache using getOrSet
    const profileData = await cacheService.getOrSet<ResumeProfileType>(cacheKey, async () => {
      console.log(`[CareerService] Cache miss for CV. Extracting with AI...`);
      return await aiService.extractResume(userId, cvText);
    }, 60 * 60 * 24 * 7); // 7 days

    // 2. Save raw document
    const document = await prisma.resumeDocument.create({
      data: {
        userId,
        filename,
        originalText: cvText,
        hash: textHash
      }
    });

    // 3. Save structured profile
    const profile = await prisma.careerProfile.create({
      data: {
        userId,
        sourceResumeId: document.id,
        summary: profileData.summary,
        totalYearsOfExperience: profileData.totalYearsOfExperience,
        experiences: {
          create: profileData.experience.map((exp) => ({
            company: exp.company,
            role: exp.role,
            startDate: exp.startDate,
            endDate: exp.endDate,
            bullets: exp.bullets,
            source: 'cv'
          }))
        },
        educations: {
          create: (profileData.education || []).map((edu) => ({
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
            startDate: edu.startDate,
            endDate: edu.endDate
          }))
        },
        projects: {
          create: (profileData.projects || []).map((proj) => ({
            name: proj.name,
            description: proj.description,
            technologies: proj.technologies,
            url: proj.url
          }))
        }
      },
      include: {
        experiences: true,
        educations: true,
        projects: true
      }
    });

    // 4. Upsert skills and link to User
    if (profileData.skills && profileData.skills.length > 0) {
      for (const skillName of profileData.skills) {
        const skill = await prisma.skill.upsert({
          where: { normalizedName: skillName },
          update: {},
          create: { normalizedName: skillName }
        });
        
        // Link to user with 'cv' source and 'inferred' confidence (since AI parsed it)
        await prisma.userSkill.upsert({
          where: {
            userId_skillId: {
              userId,
              skillId: skill.id
            }
          },
          update: {},
          create: {
            userId,
            skillId: skill.id,
            confidence: 'inferred',
            source: 'cv'
          }
        });
      }
    }

    // 5. Update User Contact Info if provided
    if (profileData.contactInfo) {
      const contactUpdate: Record<string, string> = {};
      const ci = profileData.contactInfo;
      if (ci.phone)    contactUpdate.phone    = ci.phone;
      if (ci.website)  contactUpdate.website  = ci.website;
      if (ci.github)   contactUpdate.github   = ci.github;
      if (ci.linkedin) contactUpdate.linkedin = ci.linkedin;
      if (ci.location) contactUpdate.location = ci.location;

      if (Object.keys(contactUpdate).length > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: contactUpdate
        });
      }
    }

    return profile;
  }
}

export const careerService = new CareerService();
