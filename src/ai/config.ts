export function getActiveModelName(): string {
  const provider = process.env.AI_PROVIDER || 'mock';
  switch (provider) {
    case 'google':
      return process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash';
    case 'openai':
      return process.env.OPENAI_AI_MODEL || 'gpt-4o-mini';
    case 'anthropic':
      return process.env.ANTHROPIC_AI_MODEL || 'claude-3-5-sonnet-latest';
    default:
      return process.env.AI_MODEL || 'mock-model';
  }
}
