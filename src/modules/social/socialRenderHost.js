/**
 * Shared off-screen render host setup for social image and video export.
 */
import html2canvas from 'html2canvas';

const EXPORT_FRAME_CSS = `
.social-export-host {
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}
.social-export-frame {
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}
.social-export-frame > * {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
}
.social-export-frame > .card,
.social-export-frame > .wire-breaking-card,
.social-export-frame > .social-post,
.social-export-frame > .breaking-news-card {
  width: 100% !important;
  height: 100% !important;
}
`;

const BG_URL_RE = /url\(['"]?(.*?)['"]?\)/i;

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

function formatSpecification(specStr) {
  if (specStr === undefined || specStr === null || specStr === '') return '';

  const jsonObj = parseSpecsJson(specStr);
  if (jsonObj) {
    const rows = flattenSpecsEntries(jsonObj).map(([key, val]) => {
      const display = normalizeSpecValue(val);
      return `<tr><td class="spec-key">${escapeHtml(key)}</td><td class="spec-val">${escapeHtml(display)}</td></tr>`;
    });
    return `<table class="specs-table"><tbody>${rows.join('')}</tbody></table>`;
  }

  return escapeHtml(String(specStr));
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

function getSocialStagingRoot() {
  let root = document.getElementById('social-staging-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'social-staging-root';
    root.setAttribute('aria-hidden', 'true');
    document.body.appendChild(root);
  }
  return root;
}

/**
 * @param {HTMLElement} el
 * @returns {string | null}
 */
function extractBackgroundUrl(el) {
  const inline = el.style?.backgroundImage || '';
  if (inline && inline !== 'none') {
    const match = inline.match(BG_URL_RE);
    if (match?.[1]) return match[1].trim();
  }

  if (typeof getComputedStyle === 'function') {
    const computed = getComputedStyle(el).backgroundImage;
    if (computed && computed !== 'none') {
      const match = computed.match(BG_URL_RE);
      if (match?.[1]) return match[1].trim();
    }
  }

  return null;
}

/**
 * @param {string} url
 */
function isResolvableImageUrl(url) {
  if (!url || url.includes('{{')) return false;
  const trimmed = url.trim();
  return trimmed.length > 0 && trimmed !== 'none';
}

/**
 * Convert background-image layers to real img tags so html2canvas captures cover correctly.
 * @param {ParentNode} root
 */
export async function normalizeImagesForCapture(root) {
  const candidates = root.querySelectorAll(
    '.bg-image, .background-image, [style*="background-image"]'
  );

  for (const el of candidates) {
    if (!(el instanceof HTMLElement)) continue;
    const url = extractBackgroundUrl(el);
    if (!isResolvableImageUrl(url)) continue;
    if (el.querySelector('img.export-capture-img')) continue;

    const img = document.createElement('img');
    img.className = 'export-capture-img';
    img.alt = '';
    if (!url.startsWith('data:') && !url.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = url;

    Object.assign(img.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center',
      display: 'block',
      pointerEvents: 'none',
    });

    const position = typeof getComputedStyle === 'function' ? getComputedStyle(el).position : el.style.position;
    if (!position || position === 'static') {
      el.style.position = 'relative';
    }

    el.style.backgroundImage = 'none';
    el.insertBefore(img, el.firstChild);
  }

  root.querySelectorAll('img:not(.export-capture-img)').forEach((img) => {
    const src = img.getAttribute('src');
    if (!src || src.includes('{{')) return;

    if (!src.startsWith('data:') && !src.startsWith('blob:') && !img.crossOrigin) {
      img.crossOrigin = 'anonymous';
    }

    if (!img.style.objectFit && (img.classList.contains('bg-image') || img.classList.contains('hero-image'))) {
      img.style.objectFit = 'cover';
    }
  });

  await waitForImages(root);
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

/**
 * Wait for web fonts (e.g. Google Fonts @import) before canvas capture.
 */
export async function waitForFonts() {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }
}

/**
 * @param {string} templateHtml
 * @param {string} layoutCss
 * @param {Record<string, string>} rowData
 * @param {number} width
 * @param {number} height
 */
export function setupRenderHost(templateHtml, layoutCss, rowData, width, height) {
  const stagingRoot = getSocialStagingRoot();
  const htmlContent = replacePlaceholders(templateHtml, rowData);
  const cssContent = replacePlaceholders(layoutCss, rowData);

  const host = document.createElement('div');
  host.className = 'social-export-host';
  Object.assign(host.style, {
    width: `${width}px`,
    height: `${height}px`,
    minWidth: `${width}px`,
    minHeight: `${height}px`,
    overflow: 'hidden',
    position: 'relative',
    opacity: '1',
    visibility: 'visible',

    background: 'transparent',
  });

  const styleEl = document.createElement('style');
  styleEl.textContent = `${EXPORT_FRAME_CSS}\n${cssContent}`;
  host.appendChild(styleEl);

  const captureEl = document.createElement('div');
  captureEl.className = 'social-export-frame';
  Object.assign(captureEl.style, {
    width: `${width}px`,
    height: `${height}px`,
    minWidth: `${width}px`,
    minHeight: `${height}px`,
    overflow: 'hidden',
    position: 'relative',
  });
  captureEl.innerHTML = htmlContent;
  host.appendChild(captureEl);

  stagingRoot.appendChild(host);
  hideUnresolvedImages(host);

  const cleanup = () => {
    host.remove();
  };

  return { renderRoot: host, captureEl, cleanup, htmlContent, cssContent };
}

/**
 * @param {HTMLElement} captureEl
 * @param {number} width
 * @param {number} height
 */
export async function captureRenderRootToCanvas(captureEl, width, height) {
  return html2canvas(captureEl, {
    scale: 1,
    width,
    height,
    windowWidth: Math.max(width, window.innerWidth),
    windowHeight: Math.max(height, window.innerHeight),
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: null,
    imageTimeout: 20000,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
    onclone: (clonedDoc) => {

      const stagingRoot = clonedDoc.getElementById('social-staging-root');
      if (stagingRoot) {
        stagingRoot.style.transform = 'none';
        stagingRoot.style.overflow = 'visible';
      }
      clonedDoc.querySelectorAll('.social-export-render-root, .social-export-frame').forEach((el) => {

        el.style.opacity = '1';
        el.style.visibility = 'visible';
      });
    },
  });
}
