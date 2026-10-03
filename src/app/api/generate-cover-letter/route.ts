import { NextRequest, NextResponse } from 'next/server';
import { applicationService } from '../../../applications/service';
import { requireUser } from '../../../lib/auth';
import { GenerateArtifactSchema } from '../../../lib/api-schemas';
import { handleApiError } from '../../../lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { applicationId } = GenerateArtifactSchema.parse(body);

    const result = await applicationService.generateArtifacts(user.id, applicationId, { resume: false, coverLetter: true });

    return NextResponse.json({ success: true, document: result.coverLetterData });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
