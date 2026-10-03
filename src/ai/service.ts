import { AIProvider } from './provider';
import { MockAIProvider } from './providers/mock';
import { GoogleAIProvider } from './providers/google';
import { OpenAIProvider } from './providers/openai';
import { AnthropicAIProvider } from './providers/anthropic';
import { 
  ResumeProfileSchema, ResumeProfileType, 
  JobExtractionSchema, JobExtractionType, 
  JobAnalysisSchema, JobAnalysisType,
  TailoredResumeSchema, TailoredResumeType,
  CoverLetterSchema, CoverLetterType
} from './schemas';



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

  async generateText(userId: string | undefined, prompt: string, systemPrompt?: string): Promise<string> {
    return this.provider.generateText({ prompt, systemPrompt, userId });
  }

  async extractResume(userId: string | undefined, cvText: string): Promise<ResumeProfileType> {
    return this.provider.generateStructured<ResumeProfileType>({
      prompt: `Extract the following CV into a structured JSON profile matching the schema. DO NOT invent details. If something is missing, leave it empty or omit it.\n\nCV Text:\n${cvText}`,
      schema: ResumeProfileSchema,
      schemaName: 'ResumeProfile',
      userId
    });
  }

  async extractJob(userId: string | undefined, jobText: string): Promise<JobExtractionType> {
    return this.provider.generateStructured<JobExtractionType>({
      prompt: `Extract the following job description into structured data. Identify key skills required and whether they are mandatory.\n\nJob Text:\n${jobText}`,
      schema: JobExtractionSchema,
      schemaName: 'JobExtraction',
      userId
    });
  }

  async analyzeMatch(userId: string | undefined, profileData: unknown, jobData: unknown): Promise<JobAnalysisType> {
    return this.provider.generateStructured<JobAnalysisType>({
      prompt: `Compare the candidate's profile to the job requirements. Categorize the job's required skills into 'matched' (candidate clearly has it), 'missing' (candidate clearly does not have it based on constraints), and 'unknown' (not mentioned in profile, but possible).\n\nProfile:\n${JSON.stringify(profileData)}\n\nJob:\n${JSON.stringify(jobData)}`,
      schema: JobAnalysisSchema,
      schemaName: 'JobAnalysis',
      userId
    });
  }

  async generateTailoredResume(userId: string | undefined, profileData: unknown, jobData: unknown): Promise<TailoredResumeType> {
    return this.provider.generateStructured<TailoredResumeType>({
      prompt: `Generate a tailored resume based on the candidate's career profile and the target job description. Focus the summary and the bullet points on matching the job requirements. Keep it professional and factual; DO NOT invent experiences or skills that do not exist in the profile.\n\nProfile:\n${JSON.stringify(profileData)}\n\nJob:\n${JSON.stringify(jobData)}`,
      schema: TailoredResumeSchema,
      schemaName: 'TailoredResume',
      userId
    });
  }

  async generateCoverLetter(userId: string | undefined, profileData: unknown, jobData: unknown): Promise<CoverLetterType> {
    return this.provider.generateStructured<CoverLetterType>({
      prompt: `Write a compelling cover letter based on the candidate's profile and the target job description. The cover letter should highlight how the candidate's specific experiences align with the job requirements. Do not invent facts.\n\nProfile:\n${JSON.stringify(profileData)}\n\nJob:\n${JSON.stringify(jobData)}`,
      schema: CoverLetterSchema,
      schemaName: 'CoverLetter',
      userId
    });
  }
}

export const aiService = new AIService();
