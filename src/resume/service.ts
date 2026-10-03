import { prisma } from '../lib/prisma';
import { aiService } from '../ai/service';
export class ResumeService {
  /**
   * Generates tailored structured resume data (JSON) based on profile and job.
   * This explicitly DOES NOT generate HTML layout, only content.
   */
  async generateTailoredResumeData(applicationId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { profile: true, job: true }
    });

    if (!application) throw new Error("Application not found");

    const prompt = `
      You are an expert resume writer. Rewrite the following candidate profile to perfectly tailor it for the target job.
      Emphasize the skills that match the job requirements.
      Output ONLY valid JSON matching this structure: { "summary": "string", "skills": ["string"] }
      
      CANDIDATE PROFILE:
      ${JSON.stringify(application.profile)}
      
      TARGET JOB:
      ${JSON.stringify(application.job)}
    `;

    const systemPrompt = "You are a specialized resume tailoring AI. Output JSON only.";
    
    // In a full implementation, we'd use generateStructured here.
    // For this MVP step we'll use generateText and parse, or just generateText.
    // Let's rely on generateText returning a JSON string.
    const responseText = await aiService.generateText(prompt, systemPrompt);
    
    let parsedContent;
    try {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedContent = JSON.parse(cleaned);
    } catch {
      // Fallback
      parsedContent = {
        summary: "Tailored summary for " + application.job.title,
        skills: ["React", "Next.js"], // Example fallback
      };
    }

    const mockContent = JSON.stringify(parsedContent);

    const generated = await prisma.generatedResume.create({
      data: {
        applicationId,
        templateVersion: "1.0",
        modelVersion: "mock-v1",
        content: mockContent,
        htmlContent: null
      }
    });

    return generated;
  }

  /**
   * Feeds the structured JSON data into the HTML/CSS template renderer.
   */
  async renderResumeHtml(applicationId: string, _templateId: string) {
    const generated = await prisma.generatedResume.findFirst({
      where: { applicationId },
      orderBy: { createdAt: 'desc' }
    });

    if (!generated) throw new Error("No generated resume found for this application");

    const content = JSON.parse(generated.content);

    // Naive rendering
    return `
      <div>
        <h1>Curriculum Vitae</h1>
        <p><strong>Summary:</strong> ${content.summary}</p>
        <p><strong>Tailored Skills:</strong> ${content.skills?.join(', ')}</p>
      </div>
    `;
  }
}

export const resumeService = new ResumeService();
