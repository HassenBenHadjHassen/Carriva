import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../../../lib/auth';
import { handleApiError } from '../../../../../lib/api-response';
import { prisma } from '../../../../../lib/prisma';
import { z } from 'zod';

const VALID_STATUSES = ['Draft', 'Applied', 'Interview', 'Rejected', 'Offer', 'Archived'] as const;

const Schema = z.object({
  status: z.enum(VALID_STATUSES),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const { status } = Schema.parse(body);

    const application = await prisma.application.findUnique({ where: { id } });
    if (!application || application.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ status: updated.status });
  } catch (error) {
    return handleApiError(error);
  }
}
