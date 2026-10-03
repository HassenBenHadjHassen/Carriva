// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface StructuredGenerationRequest<T> {
  prompt: string;
  systemPrompt?: string;
  schema: unknown;
  schemaName: string;
  userId?: string;
}

export interface TextGenerationRequest {
  prompt: string;
  systemPrompt?: string;
  userId?: string;
}

export interface AIProvider {
  generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T>;
  generateText(request: TextGenerationRequest): Promise<string>;
}
