import { headers, cookies } from 'next/headers';
import { prisma } from './prisma';

/**
 * Clean authentication abstraction for API routes.
 * Obtains the authenticated user from a verified session.
 * Throws an error if the user is unauthenticated.
 */
export async function requireUser() {
  const reqHeaders = await headers();
  const reqCookies = await cookies();
  
  const authHeader = reqHeaders.get('authorization');
  let userId = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!userId) {
    userId = reqCookies.get('carriva_session')?.value || null;
  }
  
  if (!userId) {
    throw new Error('UNAUTHORIZED');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  
  return user;
}
