import { prisma } from '../lib/prisma';
import { matchingService } from '../matching/service';
import { resumeService } from '../resume/service';
import { coverLetterService } from '../cover-letter/service';

import { jobsService } from '../jobs/service';

export class ApplicationService {
  /**
   * Orchestrates the creation of an application.
   */
  async createApplication(userId: string, profileId: string, jobDescription: string) {
    // 1. Extract the structured Job from the raw description
    const job = await jobsService.analyzeJobDescription(userId, jobDescription);

    // 2. Check if application exists
    let application = await prisma.application.findFirst({
      where: { userId, profileId, jobId: job.id }
    });

    if (!application) {
      application = await prisma.application.create({
        data: {
          userId,
          profileId,
          jobId: job.id,
          status: 'Analyzed'
        }
      });
    }

    // 3. Run deterministic match analysis
    const matchAnalysis = await matchingService.compareProfileToJob(profileId, job.id);

    // If there are unknown skills, we wait for confirmation. Otherwise, we can generate right away.
    if (matchAnalysis.analysis.unknown.length > 0) {
      await prisma.application.update({
        where: { id: application.id },
        data: { status: 'AwaitingConfirmation' }
      });
    } else {
      await prisma.application.update({
        where: { id: application.id },
        data: { status: 'Ready' }
      });
    }

    return { application, matchAnalysis: matchAnalysis.analysis, job };
  }

  async confirmSkills(userId: string, applicationId: string, confirmedSkills: string[]) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { profile: true }
    });

    if (!application || application.userId !== userId) {
      throw new Error("Application not found or unauthorized");
    }

    // Upsert confirmed skills to UserSkill
    for (const skillName of confirmedSkills) {
      const normalizedSkill = matchingService.normalizeSkill(skillName);
      
      const skill = await prisma.skill.upsert({
        where: { normalizedName: normalizedSkill },
        update: {},
        create: { normalizedName: normalizedSkill }
      });
      
      await prisma.userSkill.upsert({
        where: {
          userId_skillId: {
            userId,
            skillId: skill.id
          }
        },
        update: {
          confidence: 'confirmed'
        },
        create: {
          userId,
          skillId: skill.id,
          confidence: 'confirmed',
          source: 'user' // Marked as confirmed directly by user
        }
      });
    }

    // Important: Increment profile version to invalidate caches (Step 9)
    await prisma.careerProfile.update({
      where: { id: application.profileId },
      data: { version: application.profile.version + 1 }
    });

    // Update application status
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'Ready' }
    });

    return true;
  }

  async generateArtifacts(userId: string, applicationId: string) {
    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application || application.userId !== userId) {
       throw new Error("Application not found or unauthorized");
    }

    // Generate Tailored Resume and Cover Letter
    await resumeService.generateTailoredResumeData(applicationId);
    await coverLetterService.generateTailoredCoverLetter(applicationId);

    // Transition state
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'Generated' }
    });

    return { status: 'Generated' };
  }
}

export const applicationService = new ApplicationService();
