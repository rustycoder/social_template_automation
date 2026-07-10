/**
 * Vite server middleware plugin — POST /api/render
 * Receives { html, width, height } and returns a pixel-perfect PNG
 * screenshot via a Puppeteer-managed headless Chromium instance.
 */

import { existsSync } from 'fs';

let browserInstance = null;

/**
 * @description Resolves a locally installed Chrome/Chromium binary (macOS, Windows, Linux).
 * @returns {string | null}
 */
function findSystemChrome() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * @description Resolves Chrome for Puppeteer: env → system install → Puppeteer cache.
 * @param {typeof import('puppeteer')} puppeteerModule
 * @returns {Promise<string>}
 */
async function resolveExecutablePath(puppeteerModule) {
  const systemChrome = findSystemChrome();
  if (systemChrome) {
    console.log(`[renderApi] Using system Chrome: ${systemChrome}`);
    return systemChrome;
  }

  try {
    const cached = puppeteerModule.default.executablePath();
    if (cached && existsSync(cached)) {
      console.log(`[renderApi] Using Puppeteer Chrome cache: ${cached}`);
      return cached;
    }
  } catch {
    // Cache miss — fall through to install hint
  }

  throw new Error(
    'Chrome not found. Install it with: npm run browsers:install — or set CHROME_PATH to your Chrome binary.'
  );
}

async function getBrowser() {
  if (browserInstance) return browserInstance;

  const puppeteer = await import('puppeteer');
  const executablePath = await resolveExecutablePath(puppeteer);

  browserInstance = await puppeteer.default.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

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
