import { NextRequest, NextResponse } from 'next/server';
import { applicationService } from '../../../applications/service';
import { requireUser } from '../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    
    const body = await req.json();
    const { profileId, jobDescription } = body;
    
    if (!profileId || !jobDescription) {
      return NextResponse.json({ error: 'Missing profileId or jobDescription' }, { status: 400 });
    }

    // Use orchestration service to handle the main flow
    const { application, matchAnalysis, job } = await applicationService.createApplication(user.id, profileId, jobDescription);

    return NextResponse.json({
      success: true,
      job,
      applicationId: application.id,
      analysis: matchAnalysis
    });
    
  } catch (error: unknown) {
    console.error('Error analyzing job:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
