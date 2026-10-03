import { generateObject, generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { AIProvider, StructuredGenerationRequest, TextGenerationRequest } from '../provider';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export class GoogleAIProvider implements AIProvider {
  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T> {
    console.log(`[GoogleAI] Generating structured data for schema: ${request.schemaName}`);
    
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: request.schema as any,
      system: request.systemPrompt,
      prompt: request.prompt,
    });
    
    return object as unknown as T;
  }

  async generateText(request: TextGenerationRequest): Promise<string> {
    console.log(`[GoogleAI] Generating text`);
    
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      system: request.systemPrompt,
      prompt: request.prompt,
    });
    
    return text;
  }
}
