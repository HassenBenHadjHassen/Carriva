import { generateObject, generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { AIProvider, StructuredGenerationRequest, TextGenerationRequest } from '../provider';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export class AnthropicAIProvider implements AIProvider {
  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T> {
    console.log(`[AnthropicAI] Generating structured data for schema: ${request.schemaName}`);
    const modelName = process.env.AI_MODEL || 'claude-3-5-sonnet-latest';
    
    const { object } = await generateObject({
      model: anthropic(modelName),
      schema: request.schema as any,
      system: request.systemPrompt,
      prompt: request.prompt,
    });
    
    return object as unknown as T;
  }

  async generateText(request: TextGenerationRequest): Promise<string> {
    console.log(`[AnthropicAI] Generating text`);
    const modelName = process.env.AI_MODEL || 'claude-3-5-sonnet-latest';
    
    const { text } = await generateText({
      model: anthropic(modelName),
      system: request.systemPrompt,
      prompt: request.prompt,
    });
    
    return text;
  }
}
