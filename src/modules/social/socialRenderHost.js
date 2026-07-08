/**
 * Shared off-screen render host setup for social image and video export.
 */
import html2canvas from 'html2canvas';

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

function expandRowData(rowData) {
  return { ...rowData };
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
    return data[header] ?? '';
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

  const captureHost = document.createElement('div');
  captureHost.className = 'social-export-frame';
  Object.assign(captureHost.style, {
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

  const shadow = captureHost.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>${cssContent}</style>${htmlContent}`;

  const renderRoot = document.createElement('div');
  renderRoot.className = 'social-export-render-root';
  Object.assign(renderRoot.style, {
    width: `${width}px`,
    height: `${height}px`,
    overflow: 'hidden',
    position: 'relative',
  });

  const styleEl = document.createElement('style');
  styleEl.textContent = cssContent;
  renderRoot.appendChild(styleEl);

  const contentEl = document.createElement('div');
  contentEl.innerHTML = htmlContent;
  renderRoot.appendChild(contentEl);

  stagingRoot.appendChild(renderRoot);
  hideUnresolvedImages(renderRoot);

  const cleanup = () => {
    renderRoot.remove();
    captureHost.remove();
  };

  return { renderRoot, captureHost, cleanup, htmlContent, cssContent };
}

/**
 * @param {HTMLElement} renderRoot
 * @param {number} width
 * @param {number} height
 */
export async function captureRenderRootToCanvas(renderRoot, width, height) {
  return html2canvas(renderRoot, {
    scale: 1,
    width,
    height,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: null,
    imageTimeout: 15000,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      clonedDoc.querySelectorAll('.social-export-render-root, .social-export-frame').forEach((el) => {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
      });
    },
  });
}
