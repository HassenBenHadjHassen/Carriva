import { aiService } from '../ai/service';
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
    const cacheKey = `cv:${textHash}:v1`;

    // 1. Check cache
    const cachedProfile = await cacheService.get<ResumeProfileType>(cacheKey);
    let profileData = cachedProfile;

    if (!profileData) {
      console.log(`[CareerService] Cache miss for CV. Extracting with AI...`);
      profileData = await aiService.extractResume(cvText);
      await cacheService.set(cacheKey, profileData, 60 * 60 * 24); // 24 hours
    } else {
      console.log(`[CareerService] Cache hit for CV extraction.`);
    }

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

    return profile;
  }
}

export const careerService = new CareerService();
