import { generateObject, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { AIProvider, StructuredGenerationRequest, TextGenerationRequest } from '../provider';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIProvider implements AIProvider {
  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T> {
    console.log(`[OpenAI] Generating structured data for schema: ${request.schemaName}`);
    const modelName = process.env.AI_MODEL || 'gpt-4o-mini';
    
    const { object } = await generateObject({
      model: openai(modelName),
      schema: request.schema as any,
      system: request.systemPrompt,
      prompt: request.prompt,
    });
    
    return object as unknown as T;
  }

  async generateText(request: TextGenerationRequest): Promise<string> {
    console.log(`[OpenAI] Generating text`);
    const modelName = process.env.AI_MODEL || 'gpt-4o-mini';
    
    const { text } = await generateText({
      model: openai(modelName),
      system: request.systemPrompt,
      prompt: request.prompt,
    });
    
    return text;
  }
}
