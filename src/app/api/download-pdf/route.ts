import { NextRequest, NextResponse } from 'next/server';
import { resumeService } from '../../../resume/service';
import { coverLetterService } from '../../../cover-letter/service';
import { requireUser } from '../../../lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const applicationId = url.searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });
    }

    const cvHtml = await resumeService.renderResumeHtml(applicationId, 'default');
    const clHtml = await coverLetterService.renderCoverLetterHtml(applicationId);

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Carriva Application Documents</title>
        <style>
          body { font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #111; line-height: 1.6; }
          .page-break { page-break-before: always; margin-top: 40px; padding-top: 40px; border-top: 1px solid #eee; }
          h1 { font-size: 24px; font-weight: bold; margin-bottom: 16px; }
          h2 { font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #eaeaea; padding-bottom: 4px; }
          h3 { font-size: 16px; font-weight: 600; margin-top: 16px; margin-bottom: 8px; }
          p { margin-bottom: 12px; }
          ul { margin-left: 20px; margin-bottom: 16px; }
          li { margin-bottom: 6px; }
          .document { background: white; padding: 40px; border: 1px solid #ccc; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 40px; border-radius: 8px; }
          @media print {
            .document { border: none; box-shadow: none; padding: 0; margin: 0; }
            .page-break { border: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="document">
          ${cvHtml}
        </div>
        <div class="page-break"></div>
        <div class="document">
          ${clHtml}
        </div>
        <script>
          // Automatically open print dialog for PDF saving
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    return new NextResponse(fullHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error: unknown) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
