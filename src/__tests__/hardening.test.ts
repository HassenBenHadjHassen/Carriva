import { describe, it, expect, vi, beforeEach } from 'vitest';
import { matchingService } from '../matching/service';
import { AIService } from '../ai/service';
import { jobsService } from '../jobs/service';

// Mock DB interactions for unit testing pure logic
vi.mock('../lib/prisma', () => ({
  prisma: {
    cacheMetadata: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    job: {
      findFirst: vi.fn(),
      create: vi.fn(),
    }
  }
}));

describe('Carriva Hardening Pass Tests', () => {
  beforeEach(() => {
    process.env.AI_PROVIDER = 'mock';
  });

  describe('Provider Architecture', () => {
    it('throws error for unsupported provider', () => {
      process.env.AI_PROVIDER = 'foo';
      expect(() => new AIService()).toThrowError("Unsupported AI provider: foo");
    });

    it('initializes mock provider correctly', () => {
      process.env.AI_PROVIDER = 'mock';
      const svc = new AIService();
      expect(svc).toBeDefined();
    });
  });

  describe('Skill Normalization & Matching', () => {
    it('normalizes React aliases', () => {
      expect(matchingService.normalizeSkill('ReactJS')).toBe('React');
      expect(matchingService.normalizeSkill('react')).toBe('React');
      expect(matchingService.normalizeSkill('reactjs')).toBe('React');
    });

    it('normalizes Node aliases', () => {
      expect(matchingService.normalizeSkill('Node.js')).toBe('Node.js');
      expect(matchingService.normalizeSkill('nodejs')).toBe('Node.js');
      expect(matchingService.normalizeSkill('node')).toBe('Node.js');
    });

    it('returns original case for unmapped skills', () => {
      expect(matchingService.normalizeSkill('SomeRandomSkill')).toBe('SomeRandomSkill');
    });
  });

  describe('Job Normalization', () => {
    it('collapses multiple whitespace and normalizes casing', () => {
      // Accessing private method for testing
      const normalize = (jobsService as any).normalizeJobDescription.bind(jobsService);
      const text = "  Hello \n\n WORLD   ";
      expect(normalize(text)).toBe("hello \n world");
    });
  });
});
