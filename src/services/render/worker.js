/**
 * Render worker child process.
 * Owns Puppeteer so the API process never imports it (avoids host stdin EEXIST).
 *
 * IPC protocol:
 *   → { id, type: 'screenshot', html, width, height }
 *   ← { id, ok: true, png: base64 } | { id, ok: false, error }
 *   → { type: 'shutdown' }
 *   ← { type: 'ready' } on boot
 */

import './stdinGuard.js';
import { screenshotHtmlInProcess } from './screenshotPage.js';
import { closeBrowser } from './browser.js';

async function handleMessage(msg) {
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'shutdown') {
    await closeBrowser();
    process.exit(0);
  }

  if (msg.type === 'screenshot') {
    const { id, html, width, height } = msg;
    try {
      const buffer = await screenshotHtmlInProcess(html, width, height);
      process.send?.({ id, ok: true, png: buffer.toString('base64') });
    } catch (error) {
      process.send?.({
        id,
        ok: false,
        error: error?.message || String(error),
      });
    }
  }
}

process.on('message', (msg) => {
  handleMessage(msg).catch((error) => {
    console.error('[render-worker] Unhandled message error:', error);
  });
});

process.on('disconnect', async () => {
  await closeBrowser();
  process.exit(0);
});

process.send?.({ type: 'ready' });
console.log('[render-worker] ready');
