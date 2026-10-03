import { NextRequest, NextResponse } from 'next/server';
import { careerService } from '../../../career/service';
import { requireUser } from '../../../lib/auth';
import { handleApiError } from '../../../lib/api-response';
import { checkRateLimit } from '../../../lib/rate-limit';
import { PDFParse } from 'pdf-parse';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    
    // Rate limit: 10 CV uploads per user per hour
    await checkRateLimit(`rate-limit:upload-cv:${user.id}`, 10, 3600);
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 400 });
    }

    let cvText = '';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      cvText = parsed.text;
      await parser.destroy();
    } else {
      cvText = buffer.toString('utf-8');
    }

    if (!cvText || cvText.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract text from file' }, { status: 400 });
    }
    
    if (cvText.length > 100000) {
      return NextResponse.json({ error: 'Extracted text exceeds reasonable limit' }, { status: 400 });
    }

    const profile = await careerService.extractProfileFromCV(user.id, file.name, cvText);

    return NextResponse.json({ success: true, profileId: profile.id });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
