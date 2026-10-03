import { NextRequest, NextResponse } from 'next/server';
import { applicationService } from '../../../applications/service';
import { requireUser } from '../../../lib/auth';
import { ConfirmSkillsSchema } from '../../../lib/api-schemas';
import { handleApiError } from '../../../lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    
    const { applicationId, skillResponses } = ConfirmSkillsSchema.parse(body);

    await applicationService.confirmSkills(user.id, applicationId, skillResponses);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
