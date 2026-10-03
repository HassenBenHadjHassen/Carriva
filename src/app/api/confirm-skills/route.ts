import { NextRequest, NextResponse } from 'next/server';
import { applicationService } from '../../../applications/service';
import { requireUser } from '../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { applicationId, skillResponses } = await req.json();

    if (!applicationId || !skillResponses) {
      return NextResponse.json({ error: 'Missing applicationId or skillResponses' }, { status: 400 });
    }

    await applicationService.confirmSkills(user.id, applicationId, skillResponses);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error confirming skills:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
