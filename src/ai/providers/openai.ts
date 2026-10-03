import { generateObject, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { AIProvider, StructuredGenerationRequest, TextGenerationRequest } from '../provider';
import { prisma } from '../../lib/prisma';
import { getActiveModelName } from '../config';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIProvider implements AIProvider {
  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T> {
    console.log(`[OpenAI] Generating structured data for schema: ${request.schemaName}`);
    const modelName = getActiveModelName();
    
    const { object, usage } = await generateObject({
      model: openai(modelName),
      schema: request.schema as any,
      system: request.systemPrompt,
      prompt: request.prompt,
    });
    
    if (usage) {
      prisma.aIUsage.create({
        data: {
          provider: 'openai',
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
    console.log(`[OpenAI] Generating text`);
    const modelName = getActiveModelName();
    
    const { text, usage } = await generateText({
      model: openai(modelName),
      system: request.systemPrompt,
      prompt: request.prompt,
    });

    if (usage) {
      prisma.aIUsage.create({
        data: {
          provider: 'openai',
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
