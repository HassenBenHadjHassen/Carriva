import { NextRequest, NextResponse } from 'next/server';
import { resumeService } from '../../../resume/service';
import { coverLetterService } from '../../../cover-letter/service';
import { requireUser } from '../../../lib/auth';
import { handleApiError } from '../../../lib/api-response';
import { cacheKeys } from '../../../cache/keys';
import puppeteer from 'puppeteer';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const applicationIdRaw = url.searchParams.get('applicationId');
    const typeRaw = url.searchParams.get('type') || 'both';

    if (!applicationIdRaw) {
      return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });
    }

    const type = typeRaw as 'cv' | 'cl' | 'both';

    // Security check: verify application ownership
    const { prisma } = await import('../../../lib/prisma');
    const application = await prisma.application.findUnique({ where: { id: applicationIdRaw } });
    if (!application || application.userId !== user.id) {
      return NextResponse.json({ error: 'Application not found or unauthorized' }, { status: 403 });
    }

    const generatedResume = await prisma.generatedResume.findFirst({ where: { applicationId: applicationIdRaw }, orderBy: { createdAt: 'desc' } });
    const coverLetter = await prisma.generatedCoverLetter.findFirst({ where: { applicationId: applicationIdRaw }, orderBy: { createdAt: 'desc' } });

    const cvId = generatedResume?.id || 'none';
    const clId = coverLetter?.id || 'none';
    const cacheKey = cacheKeys.pdf(type, cvId, clId);

    const { cacheService } = await import('../../../cache/redis');

    const base64Pdf = await cacheService.getOrSet(cacheKey, async () => {
      let fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Carriva</title><style>@media print { .page-break { page-break-before: always; } }</style></head><body>`;
      
      const includeCv = type === 'cv' || type === 'both';
      const includeCl = type === 'cl' || type === 'both';

      if (includeCv && cvId !== 'none') {
        const cvHtml = await resumeService.renderResumeHtml(applicationIdRaw, 'default');
        fullHtml += `<div>${cvHtml}</div>`;
      }
      
      if (includeCv && includeCl && cvId !== 'none' && clId !== 'none') {
        fullHtml += `<div class="page-break"></div>`;
      }

      if (includeCl && clId !== 'none') {
        const clHtml = await coverLetterService.renderCoverLetterHtml(applicationIdRaw);
        fullHtml += `<div>${clHtml}</div>`;
      }

      fullHtml += `</body></html>`;

      // Render PDF with Puppeteer
      const browser = await puppeteer.launch({ headless: true });
      try {
        const page = await browser.newPage();
        await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });
        const pdfUint8Array = await page.pdf({ 
          format: 'A4', 
          printBackground: true, 
          margin: { top: '0', right: '0', bottom: '0', left: '0' } 
        });
        return Buffer.from(pdfUint8Array).toString('base64');
      } finally {
        await browser.close();
      }
    }, 60 * 60 * 24 * 7); // 7 days cache

    const pdfBuffer = Buffer.from(base64Pdf, 'base64');

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="application-documents.pdf"',
      },
    });

  } catch (error: unknown) {
    return handleApiError(error);
  }
}
