import { generateObject, generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { AIProvider, StructuredGenerationRequest, TextGenerationRequest } from '../provider';
import { prisma } from '../../lib/prisma';
import { getActiveModelName } from '../service';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export class AnthropicAIProvider implements AIProvider {
  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T> {
    console.log(`[AnthropicAI] Generating structured data for schema: ${request.schemaName}`);
    const modelName = getActiveModelName();
    
    const { object, usage } = await generateObject({
      model: anthropic(modelName),
      schema: request.schema as any,
      system: request.systemPrompt,
      prompt: request.prompt,
    });
    
    if (usage) {
      prisma.aIUsage.create({
        data: {
          provider: 'anthropic',
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
    console.log(`[AnthropicAI] Generating text`);
    const modelName = getActiveModelName();
    
    const { text, usage } = await generateText({
      model: anthropic(modelName),
      system: request.systemPrompt,
      prompt: request.prompt,
    });
    
    if (usage) {
      prisma.aIUsage.create({
        data: {
          provider: 'anthropic',
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
