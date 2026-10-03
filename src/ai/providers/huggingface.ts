import { generateObject, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { AIProvider, StructuredGenerationRequest, TextGenerationRequest } from '../provider';
import { prisma } from '../../lib/prisma';
import { getModelNameForProvider } from '../config';

const huggingface = createOpenAI({
  baseURL: 'https://router.huggingface.co/v1',
  apiKey: process.env.HUGGINGFACE_API_KEY,
});

export class HuggingFaceAIProvider implements AIProvider {
  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T> {
    console.log(`[HuggingFace] Generating structured data for schema: ${request.schemaName}`);
    const modelName = getModelNameForProvider('huggingface');
    
    const { object, usage } = await generateObject({
      model: huggingface(modelName),
      schema: request.schema as any,
      system: request.systemPrompt,
      prompt: request.prompt,
    });
    
    if (usage) {
      prisma.aIUsage.create({
        data: {
          provider: 'huggingface',
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
    console.log(`[HuggingFace] Generating text`);
    const modelName = getModelNameForProvider('huggingface');
    
    const { text, usage } = await generateText({
      model: huggingface(modelName),
      system: request.systemPrompt,
      prompt: request.prompt,
    });

    if (usage) {
      prisma.aIUsage.create({
        data: {
          provider: 'huggingface',
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
