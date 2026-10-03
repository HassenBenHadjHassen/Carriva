import { prisma } from './prisma';

/**
 * Temporary auth helper for MVP.
 * In production, this would use NextAuth / Better Auth and check session tokens.
 */
export async function requireUser() {
  let user = await prisma.user.findFirst();
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User'
      }
    });
  }
  
  return user;
}
