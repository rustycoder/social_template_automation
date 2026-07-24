/**
 * Shared Puppeteer Chromium singleton for PNG screenshots.
 */

import { existsSync } from 'fs';

let browserInstance = null;
let launching = null;

/**
 * @returns {string | null}
 */
function findSystemChrome() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA
      ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
      : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * @param {typeof import('puppeteer')} puppeteerModule
 * @returns {Promise<string>}
 */
async function resolveExecutablePath(puppeteerModule) {
  const systemChrome = findSystemChrome();
  if (systemChrome) {
    console.log(`[render] Using system Chrome: ${systemChrome}`);
    return systemChrome;
  }

  try {
    const cached = puppeteerModule.default.executablePath();
    if (cached && existsSync(cached)) {
      console.log(`[render] Using Puppeteer Chrome cache: ${cached}`);
      return cached;
    }
  } catch {
    // Cache miss
  }

  throw new Error(
    'Chrome not found. Install it with: npm run browsers:install — or set CHROME_PATH / PUPPETEER_EXECUTABLE_PATH.'
  );
}

/**
 * @returns {Promise<import('puppeteer').Browser>}
 */
export async function getBrowser() {
  if (browserInstance) return browserInstance;
  if (launching) return launching;

  launching = (async () => {
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
  })();

  try {
    return await launching;
  } finally {
    launching = null;
  }
}

export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
}
