import { NextRequest, NextResponse } from 'next/server';
import { jobsService } from '../../../jobs/service';
import { matchingService } from '../../../matching/service';
import { requireUser } from '../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    
    const body = await req.json();
    const { profileId, jobDescription } = body;
    
    if (!profileId || !jobDescription) {
      return NextResponse.json({ error: 'Missing profileId or jobDescription' }, { status: 400 });
    }

    // 1. Extract the structured Job from the raw description
    const job = await jobsService.analyzeJobDescription(user.id, jobDescription);

    // 2. Perform the matching analysis
    const result = await matchingService.compareProfileToJob(profileId, job.id);

    return NextResponse.json({
      success: true,
      job,
      applicationId: result.applicationId,
      analysis: result.analysis
    });
    
  } catch (error: unknown) {
    console.error('Error analyzing job:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
