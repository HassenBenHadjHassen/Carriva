export interface StructuredGenerationRequest<T> {
  prompt: string;
  systemPrompt?: string;
  schema: unknown; // Ideally Zod type, we can use unknown here and cast in provider
  schemaName: string;
}

export interface TextGenerationRequest {
  prompt: string;
  systemPrompt?: string;
}

export interface AIProvider {
  generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T>;
  generateText(request: TextGenerationRequest): Promise<string>;
}
