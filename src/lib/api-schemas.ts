import { z } from 'zod';

export const AnalyzeJobSchema = z.object({
  profileId: z.string().min(1),
  description: z.string().min(10)
});

export const ConfirmSkillsSchema = z.object({
  applicationId: z.string().min(1),
  skillResponses: z.record(z.object({
    state: z.enum(['confirmed', 'rejected', 'unknown']),
    context: z.string().optional()
  }))
});

export const GenerateArtifactSchema = z.object({
  applicationId: z.string().min(1)
});

export const DownloadPdfSchema = z.object({
  applicationId: z.string().min(1),
  type: z.enum(['cv', 'cl', 'both']).default('both')
});
