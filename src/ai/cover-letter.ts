import { aiService, block, DATA_BOUNDARY, warnOnUnverifiedNumbers, hasPlaceholders } from './service';
import { CoverLetterType, CoverLetterSchema, JobAnalysisType } from './schemas';

const LOG_TAG = '[AIService]';

/** Target range given to the model. */
const WORD_TARGET = { min: 250, max: 350 } as const;
/** Looser range used for validation (the sign-off and contact lines add words). */
const WORD_LIMITS = { min: 220, max: 400 } as const;

/** Technologies we check for in the letter, to catch skills the model invented. */
const TECH_TERMS = [
  'GraphQL', 'REST', 'React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'TypeScript', 'JavaScript',
  'Node.js', 'Express', 'NestJS', 'Python', 'Django', 'Flask', 'Java', 'Kotlin', 'Go', 'Rust',
  'Ruby', 'Rails', 'PHP', 'Laravel', 'PostgreSQL', 'Postgres', 'MySQL', 'MongoDB', 'Redis',
  'Kafka', 'RabbitMQ', 'Docker', 'Kubernetes', 'Terraform', 'AWS', 'GCP', 'Azure', 'Lambda',
  'Grafana', 'Sentry', 'Datadog', 'Prometheus', 'MCP', 'LangChain', 'OpenAI', 'Anthropic',
  'Tailwind', 'Redux', 'Prisma', 'Jest', 'Vitest', 'Cypress', 'Playwright',
] as const;

type Issue = {
  code: 'placeholders' | 'length' | 'signoff';
  feedback: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Reads the candidate's name defensively, since profileData is untyped. */
function getCandidateName(profileData: unknown): string | undefined {
  const name = (profileData as { userContactInfo?: { name?: unknown } } | null)?.userContactInfo?.name;
  return typeof name === 'string' && name.trim() ? name.trim() : undefined;
}

/**
 * Replaces em/en dashes. Handles surrounding whitespace so we never produce
 * double spaces, and keeps numeric ranges tight (2020–2024 -> 2020-2024).
 */
function normalizeDashes(text: string): string {
  return text
    .replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2')
    .replace(/\s*[—–]\s*/g, ' - ');
}

/** Warns when the letter names a technology that appears in neither the profile nor the job. */
function warnOnUnverifiedTech(label: string, content: string, ...sources: unknown[]): string[] {
  const haystack = sources.map((s) => JSON.stringify(s) ?? '').join(' ').toLowerCase();
  const flagged = TECH_TERMS.filter((term) => {
    // Lookarounds instead of \b so terms like "Next.js" and "Node.js" match correctly.
    const inLetter = new RegExp(`(?<![\\w.])${escapeRegExp(term)}(?![\\w])`, 'i').test(content);
    return inLetter && !haystack.includes(term.toLowerCase());
  });
  if (flagged.length > 0) {
    console.warn(`${LOG_TAG} ${label} mentions technologies not found in the profile or job data: ${flagged.join(', ')}`);
  }
  return flagged;
}

function findIssues(content: string, candidateName: string | undefined): Issue[] {
  const issues: Issue[] = [];

  if (hasPlaceholders({ content } as CoverLetterType)) {
    issues.push({
      code: 'placeholders',
      feedback:
        'It contained bracketed placeholder text. Remove ALL square-bracket placeholders and use real values from the data, or rephrase to avoid needing them.',
    });
  }

  const words = wordCount(content);
  if (words < WORD_LIMITS.min || words > WORD_LIMITS.max) {
    issues.push({
      code: 'length',
      feedback: `It was ${words} words. The body must be ${WORD_TARGET.min}-${WORD_TARGET.max} words.`,
    });
  }

  if (candidateName && !content.slice(-400).includes(candidateName)) {
    issues.push({
      code: 'signoff',
      feedback: `It did not end with the candidate's full name ("${candidateName}") as the sign-off.`,
    });
  }

  return issues;
}

function buildSystemPrompt(hasAnalysis: boolean, retryFeedback?: string): string {
  const gapSource = hasAnalysis
    ? 'Use the <analysis> block to identify the requirements the candidate meets and the gaps.'
    : 'Compare the job\'s top requirements against the profile yourself to identify what the candidate meets and where the gaps are.';

  const retryBlock = retryFeedback
    ? `\nYOUR PREVIOUS ATTEMPT WAS REJECTED:\n${retryFeedback}\nFix every point above while keeping the rest of these rules.\n`
    : '';

  return `Write a compelling, specific cover letter from the candidate's profile for the target job.

GROUNDING (highest priority):
- Use ONLY facts, projects, technologies, metrics, and outcomes that appear in the profile. Do not invent facts.
- Tell stories at the level of detail the profile supports. If the profile only says what was built and not how, describe what was built and why it was hard in general terms. Never fabricate incidents, tradeoffs, decisions, team sizes, or results.
- Mention company details (name, product, mission, tech stack) only if they are stated in the job data. Never fill in details from memory.
- Never claim a skill, tool, or experience that is not in the profile.

STRUCTURE:
- Selection: ${gapSource} Build the letter around the strongest evidence for the requirements the candidate genuinely meets.
- Opening: lead with the candidate's strongest real match to one of the job's most important requirements. Do not open with "I am writing to apply". Name the company and its specific product or mission when the job data provides them.
- Storytelling over stats: do not restate resume bullets or generic metrics. Focus on one or two specific, complex problems from the profile (architecture, state management, difficult integrations, scale) that translate directly to the company's domain.
- Relevance: connect that past work to the challenges the company is facing, based on what the job data says.
- Handling gaps: never draw attention to a gap, and never apologize for one (e.g. do not write "while my background focuses on X, I am eager to learn Y"). Bridge it by emphasizing the most technically adjacent hard problem the candidate has already solved, without claiming the missing skill.
- Tone: confident, direct, focused on the value the candidate delivers. Not overly formal, generic, or apologetic.
- Length: ${WORD_TARGET.min}-${WORD_TARGET.max} words in the body.
- Greeting: address the letter to the company or hiring team by name if the job data provides it; otherwise use "Dear Hiring Team".

SIGN-OFF AND FORMATTING:
- End with a short closing line, then the candidate's real full name from userContactInfo.name.
- If contact info is available (phone, email, website, etc.), put it on separate lines below the name.
- NEVER use bracketed placeholders such as "[Your Name]", "[Company Name]", or "[Hiring Manager]". Use real values, or rephrase.
- Do NOT use em dashes or en dashes. Use commas, parentheses, or regular hyphens instead.
${retryBlock}
${DATA_BOUNDARY}`;
}

export async function generateCoverLetter(
  userId: string | undefined,
  profileData: unknown,
  jobData: unknown,
  analysis?: JobAnalysisType
): Promise<CoverLetterType> {
  const candidateName = getCandidateName(profileData);

  const prompt = [
    block('profile', JSON.stringify(profileData)),
    block('job', JSON.stringify(jobData)),
    analysis ? block('analysis', JSON.stringify(analysis)) : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const generate = async (retryFeedback?: string): Promise<CoverLetterType> => {
    const letter = await aiService.structured<CoverLetterType>(
      userId,
      prompt,
      CoverLetterSchema,
      'CoverLetter',
      buildSystemPrompt(Boolean(analysis), retryFeedback)
    );
    // Deterministic cleanup happens on every attempt, so dashes never trigger a retry.
    return letter.content ? { ...letter, content: normalizeDashes(letter.content) } : letter;
  };

  let letter = await generate();
  let issues = findIssues(letter.content ?? '', candidateName);

  if (issues.length > 0) {
    console.warn(`${LOG_TAG} Cover letter failed validation (${issues.map((i) => i.code).join(', ')}), retrying once.`);
    letter = await generate(issues.map((i) => `- ${i.feedback}`).join('\n'));
    issues = findIssues(letter.content ?? '', candidateName);
  }

  // Placeholders make the letter unusable, so they remain a hard failure.
  if (issues.some((i) => i.code === 'placeholders')) {
    throw new Error('Cover letter still contains placeholder text after retry');
  }

  // A missing sign-off is cheap to fix deterministically.
  if (issues.some((i) => i.code === 'signoff') && candidateName && letter.content) {
    letter = { ...letter, content: `${letter.content.trimEnd()}\n\n${candidateName}` };
  }

  // Length drift is cosmetic, so warn rather than fail.
  if (issues.some((i) => i.code === 'length')) {
    console.warn(`${LOG_TAG} Cover letter length is outside the target range after retry.`);
  }

  if (letter.content) {
    warnOnUnverifiedTech('Cover letter', letter.content, profileData, jobData);
  }
  warnOnUnverifiedNumbers('Cover letter', letter, profileData);

  return letter;
}