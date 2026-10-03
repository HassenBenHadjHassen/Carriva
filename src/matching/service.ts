import { prisma } from '../lib/prisma';
import { aiService } from '../ai/service';
import { cacheService } from '../cache/redis';
import { MATCHING_VERSION } from '../config/constants';

export class MatchingService {
  /**
   * Simple deterministic skill normalizer for common aliases.
   */
  normalizeSkill(skill: string): string {
    const s = skill.toLowerCase().trim().replace(/[^a-z0-9+#.]/g, '');
    
    const aliases: Record<string, string> = {
      'reactjs': 'React',
      'react': 'React',
      'reactnative': 'React Native',
      'nodejs': 'Node.js',
      'node': 'Node.js',
      'postgres': 'PostgreSQL',
      'postgresql': 'PostgreSQL',
      'typescript': 'TypeScript',
      'ts': 'TypeScript',
      'javascript': 'JavaScript',
      'js': 'JavaScript',
      'aws': 'AWS',
      'amazonwebservices': 'AWS',
      'k8s': 'Kubernetes',
      'kubernetes': 'Kubernetes',
      'vuejs': 'Vue.js',
      'vue': 'Vue.js'
    };

    return aliases[s] || skill.trim();
  }

  /**
   * Deterministically compare profile skills to job requirements.
   * If any complex requirements are unclear, we could optionally fallback to AI.
   * For this MVP hardening pass, we strictly use deterministic comparison.
   */
  async compareProfileToJob(profileId: string, jobId: string) {
    const profile = await prisma.careerProfile.findUnique({
      where: { id: profileId },
      include: { experiences: true, educations: true, projects: true, user: { include: { userSkills: { include: { skill: true } } } } }
    });
    
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { requirements: true }
    });

    if (!profile || !job) {
      throw new Error("Profile or Job not found");
    }

    const { MATCHING_VERSION } = await import('../config/constants');
    const cacheKey = `match:${profile.userId}:${profile.id}:${profile.version}:${job.hash}:${MATCHING_VERSION}`;
    
    const analysis = await cacheService.getOrSet(cacheKey, async () => {
      const userSkills = profile.user?.userSkills || [];
      const trustedSkills = new Set(
        userSkills
          .filter(us => ['confirmed', 'inferred', 'generated'].includes(us.confidence))
          .map(us => this.normalizeSkill(us.skill.normalizedName))
      );

      const rejectedSkills = new Set(
        userSkills
          .filter(us => us.confidence === 'rejected')
          .map(us => this.normalizeSkill(us.skill.normalizedName))
      );

      const cvText = [
        profile.summary || '',
        ...(profile.experiences.map(e => e.bullets.join(' ') + ' ' + e.role + ' ' + e.company)),
        ...(profile.projects.map(p => p.technologies.join(' ') + ' ' + p.description))
      ].join(' ').toLowerCase();

      const matched: string[] = [];
      const missing: string[] = [];
      const unknown: string[] = [];

      for (const req of job.requirements) {
        const rawReq = req.rawRequirement;
        const normalizedReq = this.normalizeSkill(rawReq);
        const lowerReq = normalizedReq.toLowerCase();
        
        if (trustedSkills.has(normalizedReq)) {
          matched.push(rawReq);
        } 
        else if (rejectedSkills.has(normalizedReq)) {
          missing.push(rawReq);
        }
        else {
          // Fallback heuristic: token-aware match to avoid C matching React
          // Escape regex characters in lowerReq just in case
          const escapedReq = lowerReq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedReq}\\b`, 'i');
          const isMentioned = regex.test(cvText);
          
          if (isMentioned) {
            unknown.push(rawReq); 
          } else {
            missing.push(rawReq);
          }
        }
      }

      return {
        matched,
        missing,
        unknown
      };
    }, 60 * 60 * 24 * 7);

    return { analysis };
  }
}

export const matchingService = new MatchingService();
