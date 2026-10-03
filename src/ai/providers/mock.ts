import { AIProvider, StructuredGenerationRequest, TextGenerationRequest } from '../provider';

export class MockAIProvider implements AIProvider {
  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T> {
    console.log(`[MockAI] Generating structured data for schema: ${request.schemaName}`);
    
    // Return deterministic mock data based on schema name
    if (request.schemaName === 'ResumeProfile') {
      return {
        summary: "Mock full-stack engineer with 4 years of experience.",
        skills: ["React", "TypeScript", "Node.js"],
        experience: [
          {
            company: "Mock Company",
            role: "Software Engineer",
            dates: "2020-2024",
            bullets: ["Built mock features", "Reduced mock latency by 30%"]
          }
        ]
      } as unknown as T;
    }

    if (request.schemaName === 'JobAnalysis') {
      return {
        matched: ["React", "TypeScript"],
        missing: ["Kubernetes", "Docker"],
        unknown: ["AWS"],
        requirements: ["React", "TypeScript", "Node.js", "Kubernetes", "Docker", "AWS"]
      } as unknown as T;
    }

    // Default mock response
    return {} as T;
  }

  async generateText(request: TextGenerationRequest): Promise<string> {
    console.log(`[MockAI] Generating text`);
    return "This is a mock generated response.";
  }
}
