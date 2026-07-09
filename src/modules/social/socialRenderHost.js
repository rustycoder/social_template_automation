/**
 * Template placeholder substitution and preview image helpers.
 */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeSpecValue(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) return val.map((v) => normalizeSpecValue(v)).join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function parseSpecsJson(specStr) {
  if (specStr === undefined || specStr === null || specStr === '') return null;
  if (typeof specStr === 'object' && !Array.isArray(specStr)) return specStr;

  let raw = String(specStr).trim().replace(/^\uFEFF/, '');
  if (!raw) return null;
  if (raw.includes('<table') || raw.includes('<tr')) return null;

  raw = raw.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  if (raw.includes('""')) raw = raw.replace(/""/g, '"');

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    /* fallback below */
  }

  return null;
}

function flattenSpecsEntries(obj) {
  const entries = [];
  for (const [key, val] of Object.entries(obj)) {
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      for (const [subKey, subVal] of Object.entries(val)) {
        entries.push([`${key} — ${subKey}`, subVal]);
      }
    } else {
      entries.push([key, val]);
    }
  }
  return entries;
}

function expandRowData(rowData) {
  const expanded = { ...rowData };
  const specsHeader = Object.keys(rowData).find((h) => {
    const n = h.trim().toLowerCase();
    return n === 'specs' || n === 'specification';
  });
  if (!specsHeader) return expanded;

  const parsed = parseSpecsJson(rowData[specsHeader]);
  if (!parsed) return expanded;

  for (const [key, val] of flattenSpecsEntries(parsed)) {
    expanded[key] = normalizeSpecValue(val);
  }
  return expanded;
}

function looksLikeUrl(value) {
  const v = String(value).trim().toLowerCase();
  return v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:') || v.startsWith('file:') || v.startsWith('blob:');
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
  const data = expandRowData(rowData);

  let processedStr = templateStr;
  const ifRegex = /\{\{#if\s+([^}]+?)\s*\}\}([\s\S]*?)\{\{\/if\}\}/gi;
  let matchFound = true;
  let iterations = 0;

  while (matchFound && iterations < 10) {
    matchFound = false;
    processedStr = processedStr.replace(ifRegex, (match, key, content) => {
      matchFound = true;
      const trimmedKey = key.trim();
      const header = Object.keys(data).find((h) => h.trim().toLowerCase() === trimmedKey.toLowerCase());
      const value = header ? data[header] : null;

      if (value !== null && value !== undefined && String(value).trim() !== '') {
        return content;
      }
      return '';
    });
    iterations++;
  }

  return processedStr.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    const header = Object.keys(data).find((h) => h.trim().toLowerCase() === trimmedKey.toLowerCase());
    if (!header) return '';

    const value = data[header] ?? '';
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
