import { z } from 'zod';

export const ExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  bullets: z.array(z.string()),
});

export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  technologies: z.array(z.string()),
  url: z.string().optional(),
});

export const ResumeProfileSchema = z.object({
  summary: z.string().optional(),
  totalYearsOfExperience: z.number().optional().describe("Total years of professional experience across all roles"),
  skills: z.array(z.string()),
  experience: z.array(ExperienceSchema),
  education: z.array(EducationSchema),
  projects: z.array(ProjectSchema),
});

export type ResumeProfileType = z.infer<typeof ResumeProfileSchema>;

export const JobExtractionSchema = z.object({
  title: z.string(),
  company: z.string(),
  requirements: z.array(z.object({
    skill: z.string().describe("A concise, normalized technical or soft skill (e.g., 'React', 'Project Management', 'HTML'). DO NOT extract full sentences, experience years, or education degrees as skills."),
    isMandatory: z.boolean()
  })),
  minimumEducation: z.string().optional().describe("e.g. 'Bachelor's degree in Computer Science'"),
  minimumYearsOfExperience: z.number().optional().describe("Minimum years of professional experience required"),
});

export type JobExtractionType = z.infer<typeof JobExtractionSchema>;

export const JobAnalysisSchema = z.object({
  matched: z.array(z.string()).describe("Skills present in both profile and job"),
  missing: z.array(z.string()).describe("Skills definitely missing from profile"),
  unknown: z.array(z.string()).describe("Skills where it is unclear if the user has them"),
  meetsEducation: z.boolean().optional().describe("True if the user meets the education requirements"),
  meetsExperience: z.boolean().optional().describe("True if the user meets the experience requirements"),
});

export type JobAnalysisType = z.infer<typeof JobAnalysisSchema>;

export const TailoredResumeSchema = z.object({
  summary: z.string(),
  experience: z.array(z.object({
    experienceId: z.string().describe("The ID of the experience from the career profile"),
    bullets: z.array(z.string()).describe("Tailored bullet points for this specific job"),
  })),
  selectedSkills: z.array(z.string()),
  selectedProjects: z.array(z.string()).describe("The IDs of the projects to include"),
});

export type TailoredResumeType = z.infer<typeof TailoredResumeSchema>;

export const CoverLetterSchema = z.object({
  content: z.string().describe("The full text of the cover letter, well-formatted with paragraphs."),
});

export type CoverLetterType = z.infer<typeof CoverLetterSchema>;
