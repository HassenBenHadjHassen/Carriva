import { aiService, block, DATA_BOUNDARY, TAILORING_RULES, warnOnUnverifiedNumbers } from './service';
import { TailoredResumeType, TailoredResumeSchema, JobAnalysisType } from './schemas';

export async function generateTailoredResume(
  userId: string | undefined,
  profileData: unknown,
  jobData: unknown,
  analysis?: JobAnalysisType
): Promise<TailoredResumeType> {
  const systemPrompt = `Generate a tailored resume from the candidate's profile for the target job. Keep it professional and factual. Do not invent experiences, skills, tools, responsibilities or metrics.

${TAILORING_RULES}

${DATA_BOUNDARY}`;

  const prompt = `${block('profile', JSON.stringify(profileData))}

${block('job', JSON.stringify(jobData))}
${analysis ? `\n${block('analysis', JSON.stringify(analysis))}\n\nUse the analysis to decide what to emphasise. Do NOT claim skills listed as 'missing'. For 'unknown' skills, only include them if the profile gives explicit evidence.` : ''}`;

  const resume = await aiService.structured<TailoredResumeType>(userId, prompt, TailoredResumeSchema, 'TailoredResume', systemPrompt);
  warnOnUnverifiedNumbers('Tailored resume', resume, profileData);
  return resume;
}
