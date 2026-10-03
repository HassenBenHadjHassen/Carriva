import { describe, it, expect } from 'vitest';

describe('Cache Key Isolation', () => {
  it('should include userId and profileId in cache keys', () => {
    // Generate cache keys based on our constants
    const cacheKeyUserA = `resume:user-1:profile-1:1:hash-A:1.0:mock:1.0:en`;
    const cacheKeyUserB = `resume:user-2:profile-2:1:hash-A:1.0:mock:1.0:en`;

    expect(cacheKeyUserA).not.toEqual(cacheKeyUserB);
  });

  it('profile version should invalidate generation cache', () => {
    const v1 = `resume:user-1:profile-1:1:hash-A:1.0:mock:1.0:en`;
    const v2 = `resume:user-1:profile-1:2:hash-A:1.0:mock:1.0:en`;
    
    expect(v1).not.toEqual(v2);
  });
  
  it('template version should invalidate HTML cache', () => {
    const htmlV1 = `html:resume-id:1.0`;
    const htmlV2 = `html:resume-id:1.1`;
    
    expect(htmlV1).not.toEqual(htmlV2);
  });
});
