import { AIProvider } from './provider';
import { MockAIProvider } from './providers/mock';
// import { AnthropicProvider } from './providers/anthropic';
// import { OpenAIProvider } from './providers/openai';

export class AIService {
  private provider: AIProvider;

  constructor() {
    const providerName = process.env.AI_PROVIDER || 'mock';

    switch (providerName.toLowerCase()) {
      case 'mock':
        this.provider = new MockAIProvider();
        break;
      // case 'anthropic':
      //   this.provider = new AnthropicProvider();
      //   break;
      // case 'openai':
      //   this.provider = new OpenAIProvider();
      //   break;
      default:
        console.warn(`Unknown AI provider "${providerName}", falling back to mock.`);
        this.provider = new MockAIProvider();
    }
  }

  // Example tasks
  async extractResume(cvText: string) {
    return this.provider.generateStructured({
      prompt: `Extract CV data: ${cvText}`,
      schema: {}, // would pass Zod schema here
      schemaName: 'ResumeProfile'
    });
  }

  async analyzeJob(jobDescription: string, userProfile: any) {
    return this.provider.generateStructured({
      prompt: `Analyze job description against profile: ${jobDescription}`,
      schema: {},
      schemaName: 'JobAnalysis'
    });
  }
}

export const aiService = new AIService();
