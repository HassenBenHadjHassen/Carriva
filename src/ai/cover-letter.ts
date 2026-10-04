import { aiService, block, DATA_BOUNDARY, warnOnUnverifiedNumbers, hasPlaceholders } from './service';
import { CoverLetterType, CoverLetterSchema, JobAnalysisType } from './schemas';

export async function generateCoverLetter(
  userId: string | undefined,
  profileData: unknown,
  jobData: unknown,
  analysis?: JobAnalysisType
): Promise<CoverLetterType> {
  const systemPrompt = (extra = '') => `Write a compelling, specific cover letter from the candidate's profile for the target job. Do not invent facts.

STRUCTURE:
- Opening: lead with the candidate's strongest match to the job's top requirement. Do not open with "I am writing to apply". Explicitly mention the company's name and their specific product or mission if provided in the job description.
- Storytelling over stats: Do not just restate resume bullet points or generic metrics. Instead, focus on a specific, complex problem the candidate solved (e.g., state management, architectural decisions, difficult integrations) that directly translates to the company's domain.
- Relevance: Tie the candidate's past work directly to the challenges the target company is facing. Show how their experience maps to the company's goals.
- Handling Gaps: Never draw negative attention to gaps (e.g., do not say "while my background focuses on X, I am eager to learn Y"). Instead, bridge the gap by emphasizing the most technically adjacent hard problem the candidate has already mastered. Never claim a skill the candidate doesn't have.
- Tone: Confident, direct, and focused on value delivery. Do not be overly formal, generic, or apologetic. Aim for 250-350 words.
- Address the letter to the company or hiring team by name if the job data provides it; otherwise use "Dear Hiring Team".

CRITICAL RULES FOR SIGN-OFF AND PLACEHOLDERS:
- The letter MUST end with the candidate's real full name from the profile's userContactInfo.name field.
- If contact info is available (phone, email, website, etc.), include it on separate lines below the name.
- NEVER use placeholder text such as "[Your Name]", "[Company Name]", "[Hiring Manager]" or any other bracketed placeholder. Use actual values, or rephrase to avoid needing them.
- DO NOT use em dashes (—) anywhere in the text. Use commas, parentheses, or regular hyphens instead.
${extra}
${DATA_BOUNDARY}`;

  const prompt = `${block('profile', JSON.stringify(profileData))}

${block('job', JSON.stringify(jobData))}
${analysis ? `\n${block('analysis', JSON.stringify(analysis))}` : ''}`;

  const generate = (extra?: string) =>
    aiService.structured<CoverLetterType>(userId, prompt, CoverLetterSchema, 'CoverLetter', systemPrompt(extra));

  let letter = await generate();

  if (hasPlaceholders(letter)) {
    console.warn('[AIService] Cover letter contained bracketed placeholders, retrying once.');
    letter = await generate('\nYour previous attempt contained bracketed placeholder text. Remove ALL square-bracket placeholders and use real values from the data.\n');
    if (hasPlaceholders(letter)) {
      throw new Error('Cover letter still contains placeholder text after retry');
    }
  }

  warnOnUnverifiedNumbers('Cover letter', letter, profileData);
  
  if (letter.content) {
    letter.content = letter.content.replace(/—/g, ' - ');
  }

  return letter;
}
