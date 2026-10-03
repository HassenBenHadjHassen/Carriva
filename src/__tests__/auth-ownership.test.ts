import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireUser } from '../lib/auth';
import { applicationService } from '../applications/service';
import { prisma } from '../lib/prisma';
import { jobsService } from '../jobs/service';

const { mockGetSession } = vi.hoisted(() => ({ mockGetSession: vi.fn() }));

vi.mock('better-auth', () => ({
  betterAuth: () => ({
    api: {
      getSession: mockGetSession
    },
    handler: vi.fn()
  })
}));

vi.mock('@better-auth/mongo-adapter', () => ({
  mongodbAdapter: vi.fn()
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Headers()),
  cookies: vi.fn(() => ({ get: vi.fn() }))
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    careerProfile: {
      findUnique: vi.fn(),
    },
    application: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    skill: {
      upsert: vi.fn(),
    },
    userSkill: {
      upsert: vi.fn(),
    }
  }
}));

vi.mock('../jobs/service', () => ({
  jobsService: {
    analyzeJobDescription: vi.fn(),
  }
}));

describe('Authentication & Ownership Hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Provisioning & requireUser()', () => {
    it('throws UNAUTHORIZED when no session exists', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      await expect(requireUser()).rejects.toThrow('UNAUTHORIZED');
    });

    it('returns existing Carriva User when authId matches', async () => {
      const mockSession = { user: { id: 'better-auth-123', email: 'test@example.com', name: 'Test' }, session: {} as any };
      mockGetSession.mockResolvedValueOnce(mockSession);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'carriva-user-1', authId: 'better-auth-123', email: 'test@example.com', name: 'Test' } as any);
      
      const user = await requireUser();
      expect(user.id).toBe('carriva-user-1');
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('migrates existing user by email and sets authId', async () => {
      const mockSession = { user: { id: 'better-auth-123', email: 'test@example.com', name: 'Test' }, session: {} as any };
      mockGetSession.mockResolvedValueOnce(mockSession);
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(null) // Not found by authId
        .mockResolvedValueOnce({ id: 'carriva-user-1', authId: null, email: 'test@example.com', name: 'Test' } as any); // Found by email
      
      vi.mocked(prisma.user.update).mockResolvedValueOnce({ id: 'carriva-user-1', authId: 'better-auth-123', email: 'test@example.com', name: 'Test' } as any);

      const user = await requireUser();
      expect(user.id).toBe('carriva-user-1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'carriva-user-1' },
        data: { authId: 'better-auth-123' }
      });
    });

    it('creates new Carriva User if completely new', async () => {
      const mockSession = { user: { id: 'better-auth-new', email: 'new@example.com', name: 'New' }, session: {} as any };
      mockGetSession.mockResolvedValueOnce(mockSession);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValueOnce({ id: 'carriva-new', authId: 'better-auth-new', email: 'new@example.com', name: 'New' } as any);

      const user = await requireUser();
      expect(user.id).toBe('carriva-new');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { authId: 'better-auth-new', email: 'new@example.com', name: 'New' }
      });
    });
  });

  describe('Ownership Enforcement', () => {
    it('prevents User A from creating an application using User B Profile', async () => {
      vi.mocked(prisma.careerProfile.findUnique).mockResolvedValueOnce({
        id: 'profile-b',
        userId: 'user-b'
      } as any);

      await expect(applicationService.createApplication('user-a', 'profile-b', 'dummy job text'))
        .rejects.toThrow('FORBIDDEN');
      
      expect(jobsService.analyzeJobDescription).not.toHaveBeenCalled();
    });

    it('prevents User A from confirming skills on User B Application', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
        id: 'app-b',
        userId: 'user-b',
        profile: {}
      } as any);

      await expect(applicationService.confirmSkills('user-a', 'app-b', { 'React': { state: 'confirmed' } }))
        .rejects.toThrow('Application not found or unauthorized');
    });

    it('prevents User A from generating artifacts for User B Application', async () => {
      vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
        id: 'app-b',
        userId: 'user-b'
      } as any);

      await expect(applicationService.generateArtifacts('user-a', 'app-b'))
        .rejects.toThrow('Application not found or unauthorized');
    });
  });
});
