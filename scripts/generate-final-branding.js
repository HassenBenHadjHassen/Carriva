const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// 1. Text Logo (Transparent, No Background)
// Supports dark text (for light themes), light text (for dark themes), or full gradient
function createTextLogoSvg({ mode = 'dark', fullGradient = false } = {}) {
  const textFill = mode === 'light' ? '#FFFFFF' : '#0F172A';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 38" width="170" height="38" fill="none">
  <defs>
    <linearGradient id="carrivaPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="45%" stop-color="#2563EB" />
      <stop offset="100%" stop-color="#6366F1" />
    </linearGradient>
    <linearGradient id="carrivaFullGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284C7" />
      <stop offset="35%" stop-color="#2563EB" />
      <stop offset="85%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#7C3AED" />
    </linearGradient>
  </defs>
  <text 
    x="2" 
    y="29" 
    font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
    font-size="33" 
    font-weight="800" 
    letter-spacing="-0.03em"
  >
    ${fullGradient 
      ? `<tspan fill="url(#carrivaFullGrad)">Carriva</tspan>`
      : `<tspan fill="url(#carrivaPrimaryGrad)">C</tspan><tspan fill="${textFill}">arriva</tspan>`
    }
  </text>
</svg>`;
}

// 2. Favicon / Lettermark "C" (Transparent, No Background)
function createFaviconSvg({ size = 64 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" fill="none">
  <defs>
    <linearGradient id="favCGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="45%" stop-color="#2563EB" />
      <stop offset="100%" stop-color="#6366F1" />
    </linearGradient>
  </defs>
  <text 
    x="12" 
    y="51" 
    font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
    font-size="58" 
    font-weight="900" 
    letter-spacing="-0.05em" 
    fill="url(#favCGrad)"
  >
    C
  </text>
</svg>`;
}

async function buildAllAssets() {
  const publicDir = path.join(__dirname, '..', 'public');
  const appDir = path.join(__dirname, '..', 'src', 'app');

  const logoDark = createTextLogoSvg({ mode: 'dark' });
  const logoLight = createTextLogoSvg({ mode: 'light' });
  const logoGrad = createTextLogoSvg({ fullGradient: true });
  const favicon = createFaviconSvg({ size: 64 });

  // 1. Write SVGs
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), logoDark);
  fs.writeFileSync(path.join(publicDir, 'logo-white.svg'), logoLight);
  fs.writeFileSync(path.join(publicDir, 'logo-gradient.svg'), logoGrad);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), favicon);
  fs.writeFileSync(path.join(appDir, 'icon.svg'), favicon);
  fs.writeFileSync(path.join(appDir, 'apple-icon.svg'), favicon);

  console.log('SVGs generated.');

  // 2. Render Transparent PNGs & ICO using Puppeteer
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  async function renderTransparent(svg, destPath, width, height) {
    const html = `<!DOCTYPE html>
    <html>
      <head>
        <style>
          html, body { 
            margin: 0; 
            padding: 0; 
            width: ${width}px; 
            height: ${height}px; 
            background: transparent !important; 
            overflow: hidden; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
          }
        </style>
      </head>
      <body>${svg}</body>
    </html>`;

    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    await page.setContent(html);
    await page.screenshot({ path: destPath, omitBackground: true });
  }

  await renderTransparent(favicon, path.join(publicDir, 'favicon-32x32.png'), 32, 32);
  await renderTransparent(favicon, path.join(publicDir, 'favicon-16x16.png'), 16, 16);
  await renderTransparent(favicon, path.join(publicDir, 'apple-touch-icon.png'), 180, 180);
  await renderTransparent(favicon, path.join(publicDir, 'icon-192.png'), 192, 192);
  await renderTransparent(favicon, path.join(publicDir, 'icon-512.png'), 512, 512);

  await renderTransparent(logoDark, path.join(publicDir, 'logo.png'), 170, 38);
  await renderTransparent(logoLight, path.join(publicDir, 'logo-white.png'), 170, 38);

  // Update favicon.ico
  fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(publicDir, 'favicon.ico'));
  fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(appDir, 'favicon.ico'));

  // Create presentation preview
  const previewHtml = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 48px; font-family: system-ui, sans-serif; background: #0B0F19; color: white; display: flex; flex-direction: column; gap: 32px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .card { padding: 36px; border-radius: 16px; display: flex; flex-direction: column; gap: 20px; }
        .card-light { background: #FFFFFF; color: #0F172A; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
        .card-dark { background: #111827; border: 1px solid #1F2937; }
        .card-transparent {
          background-color: #f1f5f9;
          background-image: 
            linear-gradient(45deg, #e2e8f0 25%, transparent 25%), 
            linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, #e2e8f0 75%), 
            linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
          background-size: 16px 16px;
          background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
        }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #6B7280; font-weight: 700; }
        .flex { display: flex; align-items: center; gap: 20px; }
      </style>
    </head>
    <body>
      <h2 style="margin:0 0 8px 0; font-size: 24px;">Carriva — Official Text Logo & Favicon</h2>
      <p style="margin:0; color:#9CA3AF; font-size: 14px;">100% transparent backgrounds &bull; Adaptive typography &bull; High-res vector &bull; Pixel-perfect favicons</p>

      <div class="grid">
        <div class="card card-light">
          <div class="label">Light Surface &bull; Transparent Wordmark</div>
          <div>${logoDark}</div>
          <div class="label" style="margin-top: 12px;">Favicon Sizes (16px, 32px, 48px)</div>
          <div class="flex">
            <div>${createFaviconSvg({ size: 48 })}</div>
            <div>${createFaviconSvg({ size: 32 })}</div>
            <div>${createFaviconSvg({ size: 16 })}</div>
          </div>
        </div>

        <div class="card card-dark">
          <div class="label">Dark Surface &bull; Transparent Wordmark</div>
          <div>${logoLight}</div>
          <div class="label" style="margin-top: 12px;">Favicon Sizes (16px, 32px, 48px)</div>
          <div class="flex">
            <div>${createFaviconSvg({ size: 48 })}</div>
            <div>${createFaviconSvg({ size: 32 })}</div>
            <div>${createFaviconSvg({ size: 16 })}</div>
          </div>
        </div>
      </div>

      <div class="card card-transparent">
        <div class="label" style="color: #475569;">Transparency Check (Checkered Canvas)</div>
        <div class="flex" style="gap: 40px;">
          <div>${logoDark}</div>
          <div>${logoGrad}</div>
          <div class="flex">
            <div>${createFaviconSvg({ size: 48 })}</div>
            <div>${createFaviconSvg({ size: 32 })}</div>
          </div>
        </div>
      </div>
    </body>
  </html>`;

  await page.setViewport({ width: 900, height: 600, deviceScaleFactor: 2 });
  await page.setContent(previewHtml);
  await page.screenshot({ path: path.join(publicDir, 'final-brand-preview.png') });

  await browser.close();
  console.log('Complete branding generation finished!');
}

buildAllAssets().catch(console.error);
