import { NextRequest, NextResponse } from 'next/server';
import { careerService } from '../../../career/service';
import { requireUser } from '../../../lib/auth';
import { PDFParse } from 'pdf-parse';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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

    const profile = await careerService.extractProfileFromCV(user.id, file.name, cvText);

    return NextResponse.json({ success: true, profileId: profile.id });
  } catch (error: unknown) {
    console.error('Error processing CV:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
