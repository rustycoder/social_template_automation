/**
 * Off-screen social post image rendering via html2canvas.
 */
import {
  setupRenderHost,
  waitForImages,
  waitForFonts,
  captureRenderRootToCanvas,
} from './socialRenderHost.js';

export { replacePlaceholders } from './socialRenderHost.js';

/**
 * @param {string} templateHtml
 * @param {string} layoutCss
 * @param {Record<string, string>} rowData
 * @param {number} width
 * @param {number} height
 */
export async function renderPostToCanvas(templateHtml, layoutCss, rowData, width, height) {
  const { renderRoot, captureEl, cleanup } = setupRenderHost(
    templateHtml,
    layoutCss,
    rowData,
    width,
    height
  );

  try {
    await waitForImages(renderRoot);
    await waitForFonts();
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const canvas = await captureRenderRootToCanvas(captureEl, width, height);
    if (!canvas.width || !canvas.height) {
      throw new Error('Image render failed (empty canvas). Check template images and try again.');
    }
    return canvas;
  } finally {
    cleanup();
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {string} [format]
 * @param {number} [quality]
 */
export function canvasToBlob(canvas, format = 'image/png', quality = 0.95) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert canvas to image blob'));
      },
      format,
      quality
    );
  });
}
