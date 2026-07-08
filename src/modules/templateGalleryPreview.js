/**
 * Live-rendered thumbnail previews for the Step 1 template gallery.
 */
import { replacePlaceholders, hideUnresolvedImages, waitForImages } from './social/socialRenderHost.js';
import { getSampleRowForTemplate } from './templateSampleData.js';

const BUCKET_ORDER = ['square', 'story', 'portrait', 'landscape'];

const GALLERY_SHADOW_CSS = `
:host {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.gallery-sheet {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.gallery-frame {
  flex-shrink: 0;
  margin: 0 !important;
  transform-origin: center center;
  overflow: hidden;
}
`;

/**
 * @param {object} template
 */
function getPreviewLayout(template) {
  const bucket =
    template.previewBucket ||
    BUCKET_ORDER.find((id) => template.layouts?.[id] != null) ||
    'square';
  const layout = template.layouts?.[bucket];
  if (!layout) return null;
  return { bucket, layout };
}

/**
 * @param {HTMLElement} mount
 */
function getShadowRoot(mount) {
  if (!mount.shadowRoot) {
    mount.attachShadow({ mode: 'open' });
  }
  return mount.shadowRoot;
}

/**
 * @param {HTMLElement} mount
 * @param {number} frameWidthPx
 * @param {number} frameHeightPx
 */
function fitGalleryPreview(mount, frameWidthPx, frameHeightPx) {
  if (!mount) return;
  const wrapper = mount.parentElement;
  const root = mount.shadowRoot;
  const frame = root?.querySelector('.gallery-frame');
  if (!wrapper || !frame || wrapper.clientWidth < 1 || wrapper.clientHeight < 1) return;

  frame.style.width = `${frameWidthPx}px`;
  frame.style.height = `${frameHeightPx}px`;
  frame.style.transform = 'none';

  const frameW = frame.offsetWidth || frameWidthPx;
  const frameH = frame.offsetHeight || frameHeightPx;
  const pad = 8;
  const availW = wrapper.clientWidth - pad;
  const availH = wrapper.clientHeight - pad;
  const scale = Math.min(availW / frameW, availH / frameH, 1);

  frame.style.transform = `scale(${scale})`;
}

/**
 * @param {object} template
 * @param {HTMLElement | null} mountEl
 * @param {{ rowData?: Record<string, string> }} [options]
 */
export function renderGalleryPreview(template, mountEl, options = {}) {
  if (!mountEl) return;

  const layoutInfo = getPreviewLayout(template);
  if (!layoutInfo) {
    mountEl.innerHTML = '<span class="gallery-preview-empty">No layout</span>';
    return;
  }

  const { layout } = layoutInfo;
  const width = layout.width ?? 1080;
  const height = layout.height ?? 1080;
  const rowData = options.rowData ?? getSampleRowForTemplate(template);

  const html = template.content?.html ?? '';
  const css = layout.css ?? '';
  const htmlContent = replacePlaceholders(html, rowData);
  const cssContent = replacePlaceholders(css, rowData);

  const root = getShadowRoot(mountEl);
  root.innerHTML = `<style>${cssContent}\n${GALLERY_SHADOW_CSS}</style><div class="gallery-sheet"><div class="gallery-frame">${htmlContent}</div></div>`;

  hideUnresolvedImages(root);

  requestAnimationFrame(() => {
    fitGalleryPreview(mountEl, width, height);
    waitForImages(root).then(() => fitGalleryPreview(mountEl, width, height));
  });
}
