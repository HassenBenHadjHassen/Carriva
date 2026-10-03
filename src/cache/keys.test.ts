import { describe, it, expect } from 'vitest';
import { cacheKeys } from './keys';
import { TEMPLATE_VERSION, PROMPT_VERSION } from '../config/constants';

describe('Cache Key Isolation', () => {
  it('should include userId and profileId in cache keys', () => {
    const keyA = cacheKeys.resumeGeneration('user-1', 'profile-1', 1, 'hash-A', 'mock');
    const keyB = cacheKeys.resumeGeneration('user-2', 'profile-2', 1, 'hash-A', 'mock');

    expect(keyA).not.toEqual(keyB);
    expect(keyA).toContain('user-1');
    expect(keyA).toContain('profile-1');
  });

  it('profile version should invalidate generation cache', () => {
    const v1 = cacheKeys.resumeGeneration('user-1', 'profile-1', 1, 'hash-A', 'mock');
    const v2 = cacheKeys.resumeGeneration('user-1', 'profile-1', 2, 'hash-A', 'mock');
    
    expect(v1).not.toEqual(v2);
  });
  
  it('template version should invalidate HTML cache', () => {
    const htmlKey = cacheKeys.htmlRender('resume-id');
    expect(htmlKey).toContain(TEMPLATE_VERSION);
  });
});

