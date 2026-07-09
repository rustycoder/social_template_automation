/**
 * Social Preview — bucket-aware Shadow DOM live preview at platform pixel dimensions.
 */
import { FORMAT_BUCKETS, PLATFORM_PRESETS } from './socialFormats.js';
import { replacePlaceholders } from './socialRenderHost.js';

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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  border-radius: 2px;
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
   * @param {import('../templateEditor.js').TemplateEditor} templateEditor
   * @param {() => string} getBucket
   * @param {() => { width: number, height: number }} getLayoutDimensions
   * @param {object} [options]
   */
  constructor(dataSource, templateEditor, getBucket, getLayoutDimensions, options = {}) {
    this.dataSource = dataSource;
    this.templateEditor = templateEditor;
    this.getBucket = getBucket;
    this.getLayoutDimensions = getLayoutDimensions;
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

    frame.style.width = `${frameWidthPx}px`;
    frame.style.height = `${frameHeightPx}px`;
    frame.style.transform = 'none';

    const frameW = frame.offsetWidth || frameWidthPx;
    const frameH = frame.offsetHeight || frameHeightPx;
    const pad = 12;
    const availW = wrapper.clientWidth - pad;
    const availH = wrapper.clientHeight - pad;
    const scale = Math.min(availW / frameW, availH / frameH);

    frame.style.transform = `scale(${scale})`;
  }

  _buildPreviewContent(rowData, cssTemplate = this.templateEditor.getCSS()) {
    const htmlTemplate = this.templateEditor.getHTML();
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
    root.innerHTML = `<style>${cssContent}\n${SOCIAL_PREVIEW_SHADOW_CSS}</style><div class="preview-sheet"><div class="social-frame">${htmlContent}</div></div>`;

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
    this.renderInto(mount, rowData, this.templateEditor.getCSS(), frameWidthPx, frameHeightPx);
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

    if (this.previewFrameWrapper) {
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
