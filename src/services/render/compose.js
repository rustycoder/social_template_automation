/**
 * Build a full HTML document ready for Puppeteer screenshot.
 */

import { config } from '../../config.js';
import { getLayoutDocumentParts } from './layouts.js';
import { replacePlaceholders } from './placeholders.js';

/**
 * Absolute origin Chromium can use to load /uploads from this API process.
 * @returns {string}
 */
export function getRenderAssetOrigin() {
  if (process.env.RENDER_ASSET_ORIGIN) {
    return String(process.env.RENDER_ASSET_ORIGIN).replace(/\/+$/, '');
  }
  return `http://127.0.0.1:${config.port}`;
}

/**
 * Rewrite root-relative /uploads paths so headless Chrome can fetch them.
 * @param {string} value
 * @param {string} [origin]
 */
export function absolutizeUploadsUrl(value, origin = getRenderAssetOrigin()) {
  if (typeof value !== 'string' || !value) return value;
  if (value.startsWith('/uploads/')) {
    return `${origin}${value}`;
  }
  if (value.startsWith('uploads/')) {
    return `${origin}/${value}`;
  }
  return value;
}

/**
 * @param {Record<string, unknown>} fieldData
 * @param {string} [origin]
 * @returns {Record<string, unknown>}
 */
export function absolutizeFieldDataUploads(fieldData, origin = getRenderAssetOrigin()) {
  if (!fieldData || typeof fieldData !== 'object' || Array.isArray(fieldData)) {
    return {};
  }
  const out = {};
  for (const [key, value] of Object.entries(fieldData)) {
    out[key] = typeof value === 'string' ? absolutizeUploadsUrl(value, origin) : value;
  }
  return out;
}

/**
 * @param {string} bodyHtml
 * @param {string} css
 * @param {number} width
 * @param {number} height
 */
export function buildFullDocument(bodyHtml, css, width, height) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
html, body { margin: 0; padding: 0; width: ${width}px; height: ${height}px; overflow: hidden; }
@font-face {
  font-family: 'EmojiF';
  src: local('Segoe UI Emoji'), local('Apple Color Emoji'), local('Noto Color Emoji'), local('Segoe UI Symbol');
  unicode-range: U+200D, U+FE0F, U+2300-23FF, U+2600-26FF, U+2700-27BF, U+FE00-FEFF, U+1F000-1FAFF, U+1F900-1F9FF, U+1F1E0-1F1FF, U+E0020-E007F;
}
${css}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/**
 * @param {string} htmlSource
 * @param {Record<string, unknown>} fieldData
 * @param {string} formatBucket
 * @returns {{ html: string, width: number, height: number, formatBucket: string }}
 */
export function composeRenderDocument(htmlSource, fieldData, formatBucket) {
  const { bodyHtml, css, width, height, formatBucket: bucket } = getLayoutDocumentParts(
    htmlSource,
    formatBucket
  );
  const resolvedFields = absolutizeFieldDataUploads(fieldData);
  const filledHtml = replacePlaceholders(bodyHtml, resolvedFields);
  const filledCss = replacePlaceholders(css, resolvedFields);
  // Also rewrite any leftover /uploads in filled markup (e.g. hard-coded sample srcs)
  const html = absolutizeUploadsUrl(
    buildFullDocument(filledHtml, filledCss, width, height).replace(
      /(src|href)=(["'])(\/uploads\/[^"']+)\2/gi,
      (_, attr, quote, path) => `${attr}=${quote}${getRenderAssetOrigin()}${path}${quote}`
    )
  );
  // The replace above already rewrote attrs; buildFullDocument string itself has no /uploads root.
  // Re-apply attr rewrite on the final document for safety:
  const finalHtml = buildFullDocument(filledHtml, filledCss, width, height).replace(
    /(src|href)=(["'])(\/uploads\/[^"']+)\2/gi,
    (_, attr, quote, path) => `${attr}=${quote}${getRenderAssetOrigin()}${path}${quote}`
  );

  return { html: finalHtml, width, height, formatBucket: bucket };
}
