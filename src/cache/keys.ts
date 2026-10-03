import { SCHEMA_VERSION, PROMPT_VERSION, MATCHING_VERSION, TEMPLATE_VERSION } from '../config/constants';

export const cacheKeys = {
  job: (hash: string, modelName: string) => 
    `job:${hash}:${SCHEMA_VERSION}:${PROMPT_VERSION}:${modelName}`,
    
  resumeGeneration: (userId: string, profileId: string, profileVersion: number, jobHash: string, modelName: string, lang = 'en') => 
    `resume:${userId}:${profileId}:${profileVersion}:${jobHash}:${TEMPLATE_VERSION}:${modelName}:${PROMPT_VERSION}:${lang}`,
    
  coverLetterGeneration: (userId: string, profileId: string, profileVersion: number, jobHash: string, modelName: string, lang = 'en') => 
    `cover-letter:${userId}:${profileId}:${profileVersion}:${jobHash}:${modelName}:${PROMPT_VERSION}:${lang}`,
    
  htmlRender: (resumeId: string, userUpdatedAt: Date) => 
    `html:${resumeId}:${TEMPLATE_VERSION}:${userUpdatedAt.getTime()}`,
    
  pdf: (type: string, cvId: string, clId: string) => 
    `pdf:${type}:${cvId}:${clId}:${TEMPLATE_VERSION}`
};
