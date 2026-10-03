import { prisma } from '../lib/prisma';
import { aiService } from '../ai/service';

export class CoverLetterService {
  async generateTailoredCoverLetter(applicationId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { profile: true, job: true }
    });

    if (!application) throw new Error("Application not found");

    const prompt = `
      You are an expert career coach. Write a compelling, professional cover letter for the candidate based on their profile and the target job.
      Keep it under 300 words. Be confident but not arrogant.
      
      CANDIDATE PROFILE:
      ${JSON.stringify(application.profile)}
      
      TARGET JOB:
      ${JSON.stringify(application.job)}
    `;

    const content = await aiService.generateText(prompt, "You are a professional cover letter writer. Output only the cover letter content.");

    const generated = await prisma.generatedCoverLetter.create({
      data: {
        applicationId,
        modelVersion: "mock-v1",
        content,
      }
    });

    return generated;
  }

  async renderCoverLetterHtml(applicationId: string) {
    const generated = await prisma.generatedCoverLetter.findFirst({
      where: { applicationId },
      orderBy: { createdAt: 'desc' }
    });

    if (!generated) throw new Error("No generated cover letter found for this application");

    return `
      <div>
        <h1>Cover Letter</h1>
        <p style="white-space: pre-wrap;">${generated.content}</p>
      </div>
    `;
  }
}

export const coverLetterService = new CoverLetterService();
