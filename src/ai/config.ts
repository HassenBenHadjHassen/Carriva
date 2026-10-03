export function getActiveProvider(): string {
  const provider = (process.env.AI_PROVIDER || 'mock').toLowerCase().trim();
  
  if (['google', 'openai', 'anthropic', 'huggingface', 'mock'].includes(provider)) {
    return provider;
  }
  
  throw new Error(`Unsupported AI_PROVIDER configuration: ${provider}`);
}

export function getActiveModelName(): string {
  const provider = getActiveProvider();
  
  switch (provider) {
    case 'google':
      return process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash';
    case 'openai':
      return process.env.OPENAI_AI_MODEL || 'gpt-4o-mini';
    case 'anthropic':
      return process.env.ANTHROPIC_AI_MODEL || 'claude-3-5-sonnet-latest';
    case 'huggingface':
      return process.env.HUGGINGFACE_AI_MODEL || 'Qwen/Qwen3-8B:nscale';
    default:
      return process.env.AI_MODEL || 'mock-model';
  }
}

