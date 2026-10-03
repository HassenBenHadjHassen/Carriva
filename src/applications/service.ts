import { prisma } from '../lib/prisma';
export class ApplicationService {
  /**
   * Orchestrates the entire application flow:
   * Draft -> Analysis -> Skill confirmation -> Resume generation -> Cover letter
   */
  async createApplication(_userId: string, _profileId: string, _jobId: string) {
    return { status: "not_implemented" };
  }

  async confirmSkills(userId: string, applicationId: string, confirmedSkills: string[]) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: { include: { requirements: true } } }
    });

    if (!application || application.userId !== userId) {
      throw new Error("Application not found");
    }

    // Upsert confirmed skills to UserSkill
    for (const skillName of confirmedSkills) {
      const skill = await prisma.skill.upsert({
        where: { normalizedName: skillName },
        update: {},
        create: { normalizedName: skillName }
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
          source: 'user'
        }
      });
    }

    return true;
  }
}

export const applicationService = new ApplicationService();
