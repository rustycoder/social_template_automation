/**
 * Template placeholder substitution and preview image helpers.
 */

function looksLikeUrl(value) {
  const v = String(value).trim().toLowerCase();
  return (
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('data:') ||
    v.startsWith('file:') ||
    v.startsWith('blob:')
  );
}

/**
 * Convert bracket-based highlight syntax to HTML:
 *   [[text]] → <span class="highlight-red">text</span>
 *   [text]  → <mark>text</mark>
 */
function applyHighlights(value) {
  if (looksLikeUrl(value)) return String(value);
  return String(value)
    .replace(/\[\[(.+?)\]\]/g, '<span class="highlight-red">$1</span>')
    .replace(/\[(.+?)\]/g, '<mark>$1</mark>');
}

/**
 * @param {string} templateStr
 * @param {Record<string, string>} rowData
 */
export function replacePlaceholders(templateStr, rowData) {
  if (!templateStr) return '';

  let processedStr = templateStr;
  const ifRegex = /\{\{#if\s+([^}]+?)\s*\}\}([\s\S]*?)\{\{\/if\}\}/gi;
  let matchFound = true;
  let iterations = 0;

  while (matchFound && iterations < 10) {
    matchFound = false;
    processedStr = processedStr.replace(ifRegex, (match, key, content) => {
      matchFound = true;
      const trimmedKey = key.trim();
      const header = Object.keys(rowData).find(
        (h) => h.trim().toLowerCase() === trimmedKey.toLowerCase()
      );
      const value = header ? rowData[header] : null;

      if (value !== null && value !== undefined && String(value).trim() !== '') {
        return content;
      }
      return '';
    });
    iterations++;
  }

  return processedStr.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    const header = Object.keys(rowData).find(
      (h) => h.trim().toLowerCase() === trimmedKey.toLowerCase()
    );
    if (!header) return '';

    const value = rowData[header] ?? '';
    return applyHighlights(value);
  });
}

/**
 * @param {ParentNode} root
 */
export function hideUnresolvedImages(root) {
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (!src || src.trim() === '' || src.includes('{{')) {
      img.style.display = 'none';
    }
  });
}

/**
 * @param {ParentNode} container
 */
export async function waitForImages(container) {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      if (img.style.display === 'none') return;
      if (img.complete && img.naturalWidth > 0) return;
      try {
        if (img.decode) await img.decode();
      } catch {
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }
    })
  );
}
