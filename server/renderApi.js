/**
 * Vite server middleware plugin — POST /api/render
 * Receives { html, width, height } and returns a pixel-perfect PNG
 * screenshot via a Puppeteer-managed headless Chromium instance.
 */

let browserInstance = null;

import { existsSync } from 'fs';

function findSystemChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
  ].filter(Boolean);
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

async function getBrowser() {
  if (browserInstance) return browserInstance;

  const puppeteer = await import('puppeteer');
  const systemChrome = findSystemChrome();
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  if (systemChrome) {
    launchOptions.executablePath = systemChrome;
    console.log(`[renderApi] Using system Chrome: ${systemChrome}`);
  }
  browserInstance = await puppeteer.default.launch(launchOptions);

  browserInstance.on('disconnected', () => {
    browserInstance = null;
  });

  return browserInstance;
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

export default function renderApiPlugin() {
  return {
    name: 'puppeteer-render-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST' || req.url !== '/api/render') {
          return next();
        }

        let body;
        try {
          const raw = await collectBody(req);
          body = JSON.parse(raw);
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
          return;
        }

        const { html, width, height } = body;
        if (!html || !width || !height) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing required fields: html, width, height' }));
          return;
        }

        let page;
        try {
          const browser = await getBrowser();
          page = await browser.newPage();
          await page.setViewport({
            width: Number(width),
            height: Number(height),
            deviceScaleFactor: 1,
          });

          await page.setContent(html, { waitUntil: 'networkidle0' });
          await page.evaluateHandle('document.fonts.ready');

          const pngBuffer = await page.screenshot({ type: 'png' });

          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Content-Length', pngBuffer.length);
          res.end(pngBuffer);
        } catch (err) {
          console.error('[renderApi] Screenshot failed:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message || 'Render failed' }));
        } finally {
          if (page) {
            await page.close().catch(() => {});
          }
        }
      });

      const shutdown = async () => {
        if (browserInstance) {
          await browserInstance.close().catch(() => {});
          browserInstance = null;
        }
      };

      server.httpServer?.on('close', shutdown);
      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    },
  };
}
