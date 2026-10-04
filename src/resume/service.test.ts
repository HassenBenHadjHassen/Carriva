import { describe, it, expect, vi } from 'vitest';
import { resumeService } from './service';
import { cacheService } from '../cache/redis';
import { prisma } from '../lib/prisma';
import fs from 'fs/promises';

vi.mock('../lib/prisma', () => ({
  prisma: {
    application: { findUnique: vi.fn() },
    generatedResume: { findFirst: vi.fn(), update: vi.fn() }
  }
}));

vi.mock('../cache/redis', () => ({
  cacheService: {
    getOrSet: vi.fn(async (key, fn) => fn())
  }
}));

vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn()
  }
}));

describe('ResumeService HTML Injection', () => {
  it('should not allow HTML injection from AI output', async () => {
    const maliciousSummary = '<script>alert("hacked")</script>';
    const maliciousBullet = '<strong>Experience</strong> with <img src=x onerror=alert(1)>';
    
    vi.mocked(prisma.generatedResume.findFirst).mockResolvedValueOnce({
      id: 'gen-1',
      htmlContent: null,
      content: JSON.stringify({
        summary: maliciousSummary,
        experience: [
          { experienceId: 'exp-1', bullets: [maliciousBullet] }
        ]
      })
    } as any);

    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      profile: {
        user: { name: 'Test', updatedAt: new Date() },
        experiences: [
          { id: 'exp-1', role: 'Dev', company: 'Corp', bullets: [] }
        ],
        educations: [],
        projects: []
      }
    } as any);

    vi.mocked(fs.readFile).mockResolvedValueOnce('body {}'); // For CSS mock
    vi.mocked(fs.readFile).mockResolvedValueOnce('fake-image-data'); // For image mock

    const html = await resumeService.renderResumeHtml('app-1', 'default');
    
    // We expect react-dom/server to escape the malicious input
    expect(html).not.toContain('<script>alert("hacked")</script>');
    expect(html).toContain('&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;');
    
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});
