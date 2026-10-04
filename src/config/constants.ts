export const PROMPT_VERSION = "1.0.0";
export const SCHEMA_VERSION = "1.0.0";
export const MATCHING_VERSION = "1.2.0";
export const TEMPLATE_VERSION = "1.0.0";

export const SKILL_CONFIDENCE = {
  CONFIRMED: 'confirmed',
  INFERRED: 'inferred',
  GENERATED: 'generated',
  REJECTED: 'rejected',
} as const;

export type SkillConfidence = typeof SKILL_CONFIDENCE[keyof typeof SKILL_CONFIDENCE];

export const APP_STATUS = {
  DRAFT: 'Draft',
  ANALYZED: 'Analyzed',
  AWAITING_CONFIRMATION: 'AwaitingConfirmation',
  READY: 'Ready',
  GENERATED: 'Generated',
  APPLIED: 'Applied',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  ARCHIVED: 'Archived',
} as const;

export type AppStatus = typeof APP_STATUS[keyof typeof APP_STATUS];
