import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/auth';
import { handleApiError } from '../../../lib/api-response';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';

const ContactSchema = z.object({
  name:     z.string().max(128).optional(),
  phone:    z.string().max(64).optional(),
  website:  z.string().max(256).optional(),
  github:   z.string().max(256).optional(),
  linkedin: z.string().max(256).optional(),
  location: z.string().max(128).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const data = ContactSchema.parse(body);

    // Only write fields that were actually sent (empty string = clear the field)
    const update: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(data)) {
      update[key] = value === '' ? null : (value ?? null);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: update,
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
