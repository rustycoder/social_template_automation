/**
 * @file features/rendering/templateGalleryPreview.js
 * @description Live-rendered thumbnail previews for the Template Page gallery grid.
 * @dependencies features/rendering/socialRenderHost.js, features/domain/templateSampleData.js
 * @state None — renders into caller-provided mount elements.
 */

/**
 * Live-rendered thumbnail previews for the Step 1 template gallery.
 */
import { replacePlaceholders, hideUnresolvedImages, waitForImages } from './socialRenderHost.js';
import { getSampleRowForTemplate } from '../domain/templateSampleData.js';

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
 * @param {string} bucket
 */
function getPreviewLayout(template, bucket) {
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
  const pad = 0;
  const availW = wrapper.clientWidth - pad;
  const availH = wrapper.clientHeight - pad;
  const scale = Math.min(availW / frameW, availH / frameH, 1);

  frame.style.transform = `scale(${scale})`;
}

/**
 * @param {HTMLElement} mount
 * @param {number} frameWidthPx
 * @param {number} frameHeightPx
 */
function bindGalleryResize(mount, frameWidthPx, frameHeightPx) {
  const wrapper = mount.parentElement;
  if (!wrapper || typeof ResizeObserver === 'undefined') return;

  if (mount._galleryResizeObserver) {
    mount._galleryResizeObserver.disconnect();
  }

  const observer = new ResizeObserver(() => {
    fitGalleryPreview(mount, frameWidthPx, frameHeightPx);
  });
  observer.observe(wrapper);
  mount._galleryResizeObserver = observer;
}

/**
 * @param {object} template
 * @param {HTMLElement | null} mountEl
 * @param {{ rowData?: Record<string, string>, bucket?: string }} [options]
 */
export function renderGalleryPreview(template, mountEl, options = {}) {
  if (!mountEl) return;

  const bucket = options.bucket ?? template.previewBucket ?? 'square';
  const layoutInfo = getPreviewLayout(template, bucket);
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
  const emojiCSS = `@font-face { font-family: 'EmojiF'; src: local('Segoe UI Emoji'), local('Apple Color Emoji'), local('Noto Color Emoji'), local('Segoe UI Symbol'); unicode-range: U+200D, U+FE0F, U+2300-23FF, U+2600-26FF, U+2700-27BF, U+FE00-FEFF, U+1F000-1FAFF, U+1F900-1F9FF, U+1F1E0-1F1FF, U+E0020-E007F; }`;
  root.innerHTML = `<style>${emojiCSS}\n${cssContent}\n${GALLERY_SHADOW_CSS}</style><div class="gallery-sheet"><div class="gallery-frame">${htmlContent}</div></div>`;

  hideUnresolvedImages(root);
  bindGalleryResize(mountEl, width, height);

  requestAnimationFrame(() => {
    fitGalleryPreview(mountEl, width, height);
    waitForImages(root).then(() => fitGalleryPreview(mountEl, width, height));
  });
}
