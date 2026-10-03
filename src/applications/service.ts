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
    let application = await prisma.application.findUnique({
      where: {
        userId_profileId_jobId: { userId, profileId, jobId: job.id }
      }
    });

    if (!application) {
      try {
        application = await prisma.application.create({
          data: {
            userId,
            profileId,
            jobId: job.id,
            status: 'Analyzed'
          }
        });
      } catch (error: any) {
        if (error.code === 'P2002') {
          application = await prisma.application.findUniqueOrThrow({
            where: {
              userId_profileId_jobId: { userId, profileId, jobId: job.id }
            }
          });
        } else {
          throw error;
        }
      }
    }

    // 3. Run deterministic match analysis
    const matchAnalysis = await matchingService.compareProfileToJob(profileId, job.id);

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

  async confirmSkills(userId: string, applicationId: string, skillResponses: Record<string, { state: 'confirmed' | 'rejected' | 'unknown', context?: string }>) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { profile: true }
    });

    if (!application || application.userId !== userId) {
      throw new Error("Application not found or unauthorized");
    }

    // Upsert skills to UserSkill based on responses
    for (const [skillName, response] of Object.entries(skillResponses)) {
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
          confidence: response.state,
          context: response.context
        },
        create: {
          userId,
          skillId: skill.id,
          confidence: response.state,
          source: 'user',
          context: response.context
        }
      });
    }

    // Important: Atomic profile version increment
    await prisma.careerProfile.update({
      where: { id: application.profileId },
      data: { version: { increment: 1 } }
    });

    // Update application status
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'Ready' }
    });

    return true;
  }

  async generateArtifacts(userId: string, applicationId: string, options: { resume?: boolean, coverLetter?: boolean } = { resume: true, coverLetter: true }) {
    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application || application.userId !== userId) {
       throw new Error("Application not found or unauthorized");
    }
    
    if (application.status !== 'Ready' && application.status !== 'Generated') {
       throw new Error("Application is not in a valid state to generate documents");
    }

    let resumeData = null;
    let coverLetterData = null;

    if (options.resume) {
      resumeData = await resumeService.generateTailoredResumeData(applicationId);
    }
    if (options.coverLetter) {
      coverLetterData = await coverLetterService.generateTailoredCoverLetter(applicationId);
    }

    // Transition state
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'Generated' }
    });

    return { status: 'Generated', resumeData, coverLetterData };
  }
}

export const applicationService = new ApplicationService();
