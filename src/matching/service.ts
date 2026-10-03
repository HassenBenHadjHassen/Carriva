import { aiService } from '../ai/service';
import { prisma } from '../lib/prisma';

export class MatchingService {
  /**
   * Compares a user's CareerProfile against a Job's requirements.
   */
  async compareProfileToJob(profileId: string, jobId: string) {
    const profile = await prisma.careerProfile.findUnique({
      where: { id: profileId },
      include: { experiences: true, educations: true, projects: true }
    });
    
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { requirements: true }
    });

    if (!profile || !job) {
      throw new Error("Profile or Job not found");
    }

    // Call AI to conceptually match the candidate's profile against the job
    const analysis = await aiService.analyzeMatch(profile, job);

    // Create an Application record to track this attempt
    // In a full implementation, you'd check if an application already exists.
    const application = await prisma.application.create({
      data: {
        userId: profile.userId,
        profileId: profile.id,
        jobId: job.id,
        status: 'Draft'
      }
    });

    return { 
      applicationId: application.id, 
      analysis 
    };
  }
}

export const matchingService = new MatchingService();
