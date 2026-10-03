import { NextRequest, NextResponse } from 'next/server';
import { coverLetterService } from '../../../cover-letter/service';
import { requireUser } from '../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { applicationId } = await req.json();

    if (!applicationId) {
      return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });
    }

    const document = await coverLetterService.generateTailoredCoverLetter(applicationId);

    return NextResponse.json({ success: true, document });
  } catch (error: unknown) {
    console.error('Error generating cover letter:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
