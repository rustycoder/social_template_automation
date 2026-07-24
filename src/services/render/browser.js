/**
 * Shared Puppeteer Chromium singleton for PNG screenshots.
 * Loaded inside the render worker (not the API process) to avoid host stdin conflicts.
 */

import './stdinGuard.js';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer';

let browserInstance = null;
let launching = null;

/**
 * @returns {string | null}
 */
function findSystemChrome() {
  // Only auto-detect system Chrome when env did not point at a binary.
  // (env paths are handled first in resolveExecutablePath)
  const candidates = [
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
 * @returns {Promise<string>}
 */
async function resolveExecutablePath() {
  // Explicit env paths always win.
  for (const candidate of [process.env.PUPPETEER_EXECUTABLE_PATH, process.env.CHROME_PATH]) {
    if (candidate && existsSync(candidate)) {
      console.log(`[render] Using Chrome from env: ${candidate}`);
      return candidate;
    }
  }

  // Prefer Puppeteer's Chrome for Testing — more reliable than system Chrome.
  try {
    const cached = await puppeteer.executablePath();
    if (cached && existsSync(cached)) {
      console.log(`[render] Using Puppeteer Chrome cache: ${cached}`);
      return cached;
    }
  } catch {
    // Cache miss
  }

  const systemChrome = findSystemChrome();
  if (systemChrome) {
    console.log(`[render] Using system Chrome: ${systemChrome}`);
    return systemChrome;
  }

  throw new Error(
    'Chrome not found. Install it with: npm run browsers:install — or set CHROME_PATH / PUPPETEER_EXECUTABLE_PATH.'
  );
}

/**
 * @returns {Promise<import('puppeteer').Browser>}
 */
export async function getBrowser() {
  if (browserInstance?.connected) return browserInstance;
  if (launching) return launching;

  launching = (async () => {
    const executablePath = await resolveExecutablePath();

    // WebSocket CDP is the default; set RENDER_PIPE=1 to try pipe transport.
    const usePipe = process.env.RENDER_PIPE === '1';

    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      pipe: usePipe,
      dumpio: process.env.RENDER_DUMPIO === '1',
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--font-render-hinting=none',
      ],
    });

    browser.on('disconnected', () => {
      if (browserInstance === browser) browserInstance = null;
    });

    browserInstance = browser;
    return browser;
  })();

  try {
    return await launching;
  } catch (error) {
    browserInstance = null;
    throw error;
  } finally {
    launching = null;
  }
}

export async function closeBrowser() {
  if (browserInstance) {
    const browser = browserInstance;
    browserInstance = null;
    await browser.close().catch(() => {});
  }
}
