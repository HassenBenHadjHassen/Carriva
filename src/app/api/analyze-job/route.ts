import { NextRequest, NextResponse } from 'next/server';
import { applicationService } from '../../../applications/service';
import { requireUser } from '../../../lib/auth';
import { AnalyzeJobSchema } from '../../../lib/api-schemas';
import { handleApiError } from '../../../lib/api-response';
import { checkRateLimit } from '../../../lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    
    // Rate limit: 10 job analysis per user per hour
    await checkRateLimit(`rate-limit:analyze-job:${user.id}`, 10, 3600);
    
    const body = await req.json();
    
    // Rename 'jobDescription' from legacy body if present, else use description
    const payload = {
      profileId: body.profileId,
      description: body.jobDescription || body.description
    };
    
    const { profileId, description } = AnalyzeJobSchema.parse(payload);
    
    const { application, matchAnalysis, job } = await applicationService.createApplication(user.id, profileId, description);

    return NextResponse.json({
      success: true,
      job,
      applicationId: application.id,
      analysis: matchAnalysis
    });
    
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
