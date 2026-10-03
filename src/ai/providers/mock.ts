import { AIProvider, StructuredGenerationRequest, TextGenerationRequest } from '../provider';

export class MockAIProvider implements AIProvider {
  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T> {
    console.log(`[MockAI] Generating structured data for schema: ${request.schemaName}`);
    
    if (request.schemaName === 'ResumeProfile') {
      return {
        summary: "Mock full-stack engineer with 4 years of experience.",
        skills: ["React", "TypeScript", "Node.js", "MongoDB"],
        experience: [
          {
            company: "Mock Company",
            role: "Software Engineer",
            startDate: "2020",
            endDate: "2024",
            bullets: ["Built mock features", "Reduced mock latency by 30%"]
          }
        ],
        education: [],
        projects: []
      } as unknown as T;
    }

    if (request.schemaName === 'JobExtraction') {
      return {
        title: "Senior Next.js Developer",
        company: "Mock Corp",
        requirements: [
          { skill: "React", isMandatory: true },
          { skill: "TypeScript", isMandatory: true },
          { skill: "Node.js", isMandatory: true },
          { skill: "Kubernetes", isMandatory: false },
          { skill: "Terraform", isMandatory: false }
        ]
      } as unknown as T;
    }

    if (request.schemaName === 'JobAnalysis') {
      return {
        matched: ["React", "TypeScript", "Node.js"],
        missing: [],
        unknown: ["Kubernetes", "Terraform"]
      } as unknown as T;
    }

    return {} as T;
  }

  async generateText(_request: TextGenerationRequest): Promise<string> {
    return "Mock response";
  }
}
