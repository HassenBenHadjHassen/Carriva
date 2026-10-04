import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { handleApiError } from '../../../lib/api-response';
import { TailoredResumeSchema } from '../../../ai/schemas';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { generatedResumeId, content } = await req.json();

    if (!generatedResumeId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validationResult = TailoredResumeSchema.safeParse(content);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid content format', details: validationResult.error }, { status: 400 });
    }

    // Verify ownership
    const generated = await prisma.generatedResume.findUnique({
      where: { id: generatedResumeId },
      include: { application: true }
    });

    if (!generated || generated.application.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });
    }

    await prisma.generatedResume.update({
      where: { id: generatedResumeId },
      data: {
        content: JSON.stringify(content),
        htmlContent: null // Invalidate the generated HTML so it re-renders on download
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
