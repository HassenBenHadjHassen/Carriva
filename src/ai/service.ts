import { AIProvider } from './provider';
import { MockAIProvider } from './providers/mock';
import { GoogleAIProvider } from './providers/google';
import { OpenAIProvider } from './providers/openai';
import { AnthropicAIProvider } from './providers/anthropic';
import { ResumeProfileSchema, ResumeProfileType, JobExtractionSchema, JobExtractionType, JobAnalysisSchema, JobAnalysisType } from './schemas';

export class AIService {
  private provider: AIProvider;

  constructor() {
    const providerName = process.env.AI_PROVIDER?.toLowerCase();

    if (!providerName) {
      throw new Error("AI_PROVIDER environment variable is not set. Valid options: mock, google, openai, anthropic");
    }

    if (providerName === 'google') {
      this.provider = new GoogleAIProvider();
    } else if (providerName === 'openai') {
      this.provider = new OpenAIProvider();
    } else if (providerName === 'anthropic') {
      this.provider = new AnthropicAIProvider();
    } else if (providerName === 'mock') {
      this.provider = new MockAIProvider();
    } else {
      throw new Error(`Unsupported AI provider: ${providerName}`);
    }
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    return this.provider.generateText({ prompt, systemPrompt });
  }

  async extractResume(cvText: string): Promise<ResumeProfileType> {
    return this.provider.generateStructured<ResumeProfileType>({
      prompt: `Extract the following CV into a structured JSON profile matching the schema. DO NOT invent details. If something is missing, leave it empty or omit it.\n\nCV Text:\n${cvText}`,
      schema: ResumeProfileSchema,
      schemaName: 'ResumeProfile'
    });
  }

  async extractJob(jobText: string): Promise<JobExtractionType> {
    return this.provider.generateStructured<JobExtractionType>({
      prompt: `Extract the following job description into structured data. Identify key skills required and whether they are mandatory.\n\nJob Text:\n${jobText}`,
      schema: JobExtractionSchema,
      schemaName: 'JobExtraction'
    });
  }

  async analyzeMatch(profileData: unknown, jobData: unknown): Promise<JobAnalysisType> {
    return this.provider.generateStructured<JobAnalysisType>({
      prompt: `Compare the candidate's profile to the job requirements. Categorize the job's required skills into 'matched' (candidate clearly has it), 'missing' (candidate clearly does not have it based on constraints), and 'unknown' (not mentioned in profile, but possible).\n\nProfile:\n${JSON.stringify(profileData)}\n\nJob:\n${JSON.stringify(jobData)}`,
      schema: JobAnalysisSchema,
      schemaName: 'JobAnalysis'
    });
  }
}

export const aiService = new AIService();
