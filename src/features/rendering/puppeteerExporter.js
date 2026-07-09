/**
 * Browser-side client that sends a complete HTML document to the
 * Puppeteer-backed /api/render endpoint and returns a PNG Blob.
 */
import { replacePlaceholders } from './socialRenderHost.js';

function buildFullDocument(bodyHtml, css, width, height) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
html, body { margin: 0; padding: 0; width: ${width}px; height: ${height}px; overflow: hidden; }
${css}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/**
 * Render a social post to a pixel-perfect PNG via the server-side Puppeteer API.
 *
 * @param {string} templateHtml  Raw template HTML (with {{placeholders}})
 * @param {string} layoutCss     Raw layout CSS   (with {{placeholders}})
 * @param {Record<string, string>} rowData  Data for placeholder substitution
 * @param {number} width   Viewport / output width in px
 * @param {number} height  Viewport / output height in px
 * @returns {Promise<Blob>}  PNG image blob
 */
export async function renderPostToPng(templateHtml, layoutCss, rowData, width, height) {
  const filledHtml = replacePlaceholders(templateHtml, rowData);
  const filledCss = replacePlaceholders(layoutCss, rowData);
  const fullDocument = buildFullDocument(filledHtml, filledCss, width, height);

  const response = await fetch('/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: fullDocument, width, height }),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const err = await response.json();
      detail = err.error || response.statusText;
    } catch {
      detail = response.statusText;
    }
    throw new Error(`Puppeteer render failed: ${detail}`);
  }

  return response.blob();
}
