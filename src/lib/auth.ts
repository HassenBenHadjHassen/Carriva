import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import db from './mongodb';
import { headers, cookies } from 'next/headers';
import { prisma } from './prisma';

export const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Provision Carriva domain user
          await prisma.user.create({
            data: {
              authId: user.id,
              email: user.email,
              name: user.name,
            },
          });
        },
      },
    },
  },
});

/**
 * Clean authentication abstraction for API routes.
 * Obtains the authenticated user from a verified Better Auth session.
 * Throws an error if the user is unauthenticated.
 */
export async function requireUser() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    throw new Error('UNAUTHORIZED');
  }

  // Find the domain user
  let domainUser = await prisma.user.findUnique({
    where: { authId: session.user.id }
  });

  if (!domainUser) {
    // If not found by authId, try migrating by email
    domainUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (domainUser) {
      // Migrate
      domainUser = await prisma.user.update({
        where: { id: domainUser.id },
        data: { authId: session.user.id }
      });
    } else {
      // Shouldn't happen often if webhook/hook works, but just in case
      domainUser = await prisma.user.create({
        data: {
          authId: session.user.id,
          email: session.user.email,
          name: session.user.name,
        }
      });
    }
  }

  return domainUser;
}

export async function getCurrentSession() {
  return await auth.api.getSession({
    headers: await headers()
  });
}
