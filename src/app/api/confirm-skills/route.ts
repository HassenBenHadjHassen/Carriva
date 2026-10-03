import { NextRequest, NextResponse } from 'next/server';
import { applicationService } from '../../../applications/service';
import { requireUser } from '../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { applicationId, confirmedSkills } = await req.json();

    if (!applicationId || !Array.isArray(confirmedSkills)) {
      return NextResponse.json({ error: 'Missing applicationId or confirmedSkills' }, { status: 400 });
    }

    await applicationService.confirmSkills(user.id, applicationId, confirmedSkills);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error confirming skills:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
