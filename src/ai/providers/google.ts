import { generateObject, generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { AIProvider, StructuredGenerationRequest, TextGenerationRequest } from '../provider';
import { prisma } from '../../lib/prisma';
import { getActiveModelName } from '../config';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export class GoogleAIProvider implements AIProvider {
  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T> {
    console.log(`[GoogleAI] Generating structured data for schema: ${request.schemaName}`);
    const modelName = getActiveModelName();
    
    const { object, usage } = await generateObject({
      model: google(modelName),
      schema: request.schema as any,
      system: request.systemPrompt,
      prompt: request.prompt,
    });
    
    if (usage) {
      prisma.aIUsage.create({
        data: {
          provider: 'google',
          model: modelName,
          action: request.schemaName,
          tokensPrompt: usage.inputTokens || 0,
          tokensCompletion: usage.outputTokens || 0,
          userId: request.userId,
        }
      }).catch(console.error);
    }
    
    return object as unknown as T;
  }

  async generateText(request: TextGenerationRequest): Promise<string> {
    console.log(`[GoogleAI] Generating text`);
    const modelName = getActiveModelName();
    
    const { text, usage } = await generateText({
      model: google(modelName),
      system: request.systemPrompt,
      prompt: request.prompt,
    });
    
    if (usage) {
      prisma.aIUsage.create({
        data: {
          provider: 'google',
          model: modelName,
          action: 'generateText',
          tokensPrompt: usage.inputTokens || 0,
          tokensCompletion: usage.outputTokens || 0,
          userId: request.userId,
        }
      }).catch(console.error);
    }
    
    return text;
  }
}
