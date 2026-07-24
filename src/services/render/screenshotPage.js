/**
 * In-process Puppeteer screenshot (runs inside the render worker).
 */

import { getBrowser } from './browser.js';
import { createSemaphore } from './semaphore.js';

const MAX_CONCURRENT_PAGES = Number(process.env.RENDER_CONCURRENCY) || 2;
const pageSemaphore = createSemaphore(MAX_CONCURRENT_PAGES);

/**
 * @param {string} html
 * @param {number} width
 * @param {number} height
 * @returns {Promise<Buffer>}
 */
export async function screenshotHtmlInProcess(html, width, height) {
  return pageSemaphore.run(async () => {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setViewport({
        width: Number(width),
        height: Number(height),
        deviceScaleFactor: 1,
      });

      // Static HTML via setContent — 'load' is reliable; networkidle0 often hangs
      // when Chrome keeps background connections open.
      await page.setContent(html, { waitUntil: 'load', timeout: 60_000 });
      await page.evaluate(() => document.fonts.ready);

      await page.evaluate(async () => {
        const images = Array.from(document.images || []);
        await Promise.all(
          images.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.addEventListener('load', resolve, { once: true });
              img.addEventListener('error', resolve, { once: true });
            });
          })
        );
      });

      const pngBuffer = await page.screenshot({ type: 'png' });
      return Buffer.from(pngBuffer);
    } finally {
      await page.close().catch(() => {});
    }
  });
}
