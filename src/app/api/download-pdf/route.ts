import { NextRequest, NextResponse } from 'next/server';
import { resumeService } from '../../../resume/service';
import { coverLetterService } from '../../../cover-letter/service';
import { requireUser } from '../../../lib/auth';
import puppeteer from 'puppeteer';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const applicationId = url.searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });
    }

    // Security check: verify application ownership
    const { prisma } = await import('../../../lib/prisma');
    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application || application.userId !== user.id) {
      return NextResponse.json({ error: 'Application not found or unauthorized' }, { status: 403 });
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
          /* Inject base styles for printing */
          @media print {
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <div>${cvHtml}</div>
        <div class="page-break"></div>
        <div>${clHtml}</div>
      </body>
      </html>
    `;

    // Render PDF with Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });
    const pdfUint8Array = await page.pdf({ 
      format: 'A4', 
      printBackground: true, 
      margin: { top: '0', right: '0', bottom: '0', left: '0' } 
    });
    await browser.close();

    // Convert Uint8Array to Buffer for NextResponse
    const pdfBuffer = Buffer.from(pdfUint8Array);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="application-documents.pdf"',
      },
    });

  } catch (error: unknown) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
