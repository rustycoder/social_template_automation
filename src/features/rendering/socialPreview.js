/**
 * Social Preview — bucket-aware Shadow DOM live preview at platform pixel dimensions.
 */
import { FORMAT_BUCKETS, PLATFORM_PRESETS } from './socialFormats.js';
import { replacePlaceholders } from './socialRenderHost.js';

const EMOJI_FONT_CSS = `
/* Emoji font fallback via unicode-range — activates only for emoji codepoints */
@font-face {
  font-family: 'EmojiF';
  src: local('Segoe UI Emoji'), local('Apple Color Emoji'), local('Noto Color Emoji'), local('Segoe UI Symbol');
  unicode-range: U+200D, U+FE0F, U+2300-23FF, U+2600-26FF, U+2700-27BF, U+FE00-FEFF, U+1F000-1FAFF, U+1F900-1F9FF, U+1F1E0-1F1FF, U+E0020-E007F;
}
`;

const SOCIAL_PREVIEW_SHADOW_CSS = `
:host {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background: transparent;
}
.preview-sheet {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.social-frame {
  flex-shrink: 0;
  margin: 0 !important;
  box-shadow: 0 8px 24px rgba(9, 9, 11, 0.12);
  border-radius: 0;
  transform-origin: center center;
  transition: transform 0.2s ease;
  will-change: transform;
  overflow: hidden;
}
`;

/**
 * @param {string} bucket
 */
export function getDefaultDimensionsForBucket(bucket) {
  const preset = PLATFORM_PRESETS.find((p) => p.bucket === bucket);
  if (preset) {
    return { width: preset.width, height: preset.height };
  }
  return { width: 1080, height: 1080 };
}

export class SocialPreview {
  /**
   * @param {import('../dataSource.js').DataSource} dataSource
   * @param {{ getHtml: () => string, getCss: (bucket?: string) => string, getBucket: () => string, getLayoutDimensions: () => { width: number, height: number } }} contentAccessors
   * @param {object} [options]
   */
  constructor(dataSource, contentAccessors, options = {}) {
    this.dataSource = dataSource;
    this.getHtml = contentAccessors.getHtml;
    this.getCss = contentAccessors.getCss;
    this.getBucket = contentAccessors.getBucket;
    this.getLayoutDimensions = contentAccessors.getLayoutDimensions;
    this.currentPreviewRow = 0;
    this.options = {
      mountId: 'preview-mount',
      frameWrapperId: 'preview-frame-wrapper',
      navId: 'preview-nav',
      prevRowBtnId: 'btn-prev-row',
      nextRowBtnId: 'btn-next-row',
      rowIndicatorId: 'preview-row-indicator',
      formatTagId: 'preview-format-tag',
      ...options,
    };

    this._bindElements();
    this._bindEvents();
    this._bindPreviewResize();
  }

  _bindElements() {
    const {
      mountId,
      frameWrapperId,
      navId,
      prevRowBtnId,
      nextRowBtnId,
      rowIndicatorId,
      formatTagId,
    } = this.options;

    this.previewMount = document.getElementById(mountId);
    this.previewFrameWrapper =
      document.getElementById(frameWrapperId) || this.previewMount?.parentElement;
    this.previewNav = document.getElementById(navId);
    this.prevRowBtn = document.getElementById(prevRowBtnId);
    this.nextRowBtn = document.getElementById(nextRowBtnId);
    this.rowIndicator = document.getElementById(rowIndicatorId);
    this.formatTag = document.getElementById(formatTagId);
  }

  _bindEvents() {
    this.prevRowBtn?.addEventListener('click', () => {
      if (this.currentPreviewRow > 0) {
        this.currentPreviewRow--;
        this.update();
      }
    });

    this.nextRowBtn?.addEventListener('click', () => {
      if (this.currentPreviewRow < this.dataSource.getRowCount() - 1) {
        this.currentPreviewRow++;
        this.update();
      }
    });
  }

  _bindPreviewResize() {
    this._onPreviewResize = () => {
      this._fitPreviewMount(this.previewMount);
    };
    window.addEventListener('resize', this._onPreviewResize);

    if (typeof ResizeObserver !== 'undefined' && this.previewFrameWrapper) {
      this._previewResizeObserver = new ResizeObserver(this._onPreviewResize);
      this._previewResizeObserver.observe(this.previewFrameWrapper);
    }
  }

  _getPreviewRoot(mount) {
    if (!mount) return null;
    if (!mount.shadowRoot) {
      mount.attachShadow({ mode: 'open' });
    }
    return mount.shadowRoot;
  }

  /**
   * @param {HTMLElement | null} mount
   * @param {number} frameWidthPx
   * @param {number} frameHeightPx
   */
  _fitPreviewMount(mount, frameWidthPx, frameHeightPx) {
    if (!mount) return;
    const wrapper = mount.parentElement;
    const root = this._getPreviewRoot(mount);
    const frame = root?.querySelector('.social-frame');
    if (!wrapper || !frame || wrapper.clientWidth < 1 || wrapper.clientHeight < 1) return;

    const layoutDims = this.getLayoutDimensions();
    const width = frameWidthPx || layoutDims.width;
    const height = frameHeightPx || layoutDims.height;

    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
    frame.style.transform = 'none';

    const frameW = frame.offsetWidth || width;
    const frameH = frame.offsetHeight || height;
    const pad = this.options.skipWrapperAspectRatio ? 24 : 12;
    const availW = wrapper.clientWidth - pad;
    const availH = wrapper.clientHeight - pad;
    const scale = Math.min(availW / frameW, availH / frameH, 1);

    frame.style.transform = `scale(${scale})`;
  }

  _buildPreviewContent(rowData, cssTemplate = this.getCss()) {
    const htmlTemplate = this.getHtml();
    const htmlContent = replacePlaceholders(htmlTemplate, rowData);
    const cssContent = replacePlaceholders(cssTemplate, rowData);
    return { htmlContent, cssContent };
  }

  /**
   * Render a post into any mount at explicit CSS and pixel dimensions.
   * @param {HTMLElement | null} mount
   * @param {Record<string, string>} rowData
   * @param {string} cssTemplate
   * @param {number} frameWidthPx
   * @param {number} frameHeightPx
   */
  renderInto(mount, rowData, cssTemplate, frameWidthPx, frameHeightPx) {
    if (!mount) return;

    const { htmlContent, cssContent } = this._buildPreviewContent(rowData, cssTemplate);
    const root = this._getPreviewRoot(mount);
    root.innerHTML = `<style>${EMOJI_FONT_CSS}\n${cssContent}\n${SOCIAL_PREVIEW_SHADOW_CSS}</style><div class="preview-sheet"><div class="social-frame">${htmlContent}</div></div>`;

    root.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src');
      if (!src || src.trim() === '' || src.includes('{{')) {
        img.style.display = 'none';
      }
    });

    requestAnimationFrame(() => {
      this._fitPreviewMount(mount, frameWidthPx, frameHeightPx);
      this._waitForImages(root).then(() => this._fitPreviewMount(mount, frameWidthPx, frameHeightPx));
    });
  }

  _renderPreview(mount, rowData, frameWidthPx, frameHeightPx) {
    this.renderInto(mount, rowData, this.getCss(), frameWidthPx, frameHeightPx);
  }

  _waitForImages(root) {
    const images = Array.from(root.querySelectorAll('img'));
    if (images.length === 0) return Promise.resolve();

    return Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          })
      )
    );
  }

  _formatRowIndicator(currentIndex, rowCount) {
    return `${currentIndex + 1} / ${rowCount}`;
  }

  _updatePreviewNav(rowCount) {
    const showNav = this.dataSource.mode === 'bulk' && rowCount > 0;
    if (this.previewNav) {
      this.previewNav.classList.toggle('hidden', !showNav);
    }

    if (!showNav) return;

    const text = this._formatRowIndicator(this.currentPreviewRow, rowCount);
    const atStart = this.currentPreviewRow === 0;
    const atEnd = this.currentPreviewRow >= rowCount - 1;

    if (this.rowIndicator) this.rowIndicator.textContent = text;
    if (this.prevRowBtn) this.prevRowBtn.disabled = atStart;
    if (this.nextRowBtn) this.nextRowBtn.disabled = atEnd;
  }

  updatePreviewAspectRatio() {
    const bucket = this.getBucket();
    const { width, height } = this.getLayoutDimensions();
    const bucketLabel = FORMAT_BUCKETS[bucket]?.label ?? bucket;

    if (this.previewFrameWrapper && !this.options.skipWrapperAspectRatio) {
      this.previewFrameWrapper.style.aspectRatio = `${width} / ${height}`;
    }
    if (this.formatTag) {
      this.formatTag.textContent = bucketLabel;
    }
  }

  update() {
    const rowCount = this.dataSource.getRowCount();
    if (rowCount === 0) return;

    if (this.currentPreviewRow >= rowCount) {
      this.currentPreviewRow = rowCount - 1;
    }

    const rowData = this.dataSource.getRows()[this.currentPreviewRow];
    this.updateFromRow(rowData, rowCount);
  }

  /**
   * @param {Record<string, string>} rowData
   * @param {number} [rowCount]
   */
  updateFromRow(rowData, rowCount = 1) {
    const { width, height } = this.getLayoutDimensions();

    this.updatePreviewAspectRatio();
    this._renderPreview(this.previewMount, rowData, width, height);
    this._updatePreviewNav(rowCount);
  }
}
