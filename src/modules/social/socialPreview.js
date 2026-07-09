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

  _looksLikeUrl(value) {
    const v = String(value).trim().toLowerCase();
    return v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:') || v.startsWith('file:') || v.startsWith('blob:');
  }

  _applyHighlights(value) {
    if (this._looksLikeUrl(value)) return String(value);
    return String(value)
      .replace(/\[\[(.+?)\]\]/g, '<span class="highlight-red">$1</span>')
      .replace(/\[(.+?)\]/g, '<mark>$1</mark>');
  }

  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _normalizeSpecValue(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'number') return String(val);
    if (Array.isArray(val)) return val.map((v) => this._normalizeSpecValue(v)).join(', ');
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }

  _parseSpecsJson(specStr) {
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

  _flattenSpecsEntries(obj) {
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

  _expandRowData(rowData) {
    const expanded = { ...rowData };
    const specsHeader = Object.keys(rowData).find((h) => {
      const n = h.trim().toLowerCase();
      return n === 'specs' || n === 'specification';
    });
    if (!specsHeader) return expanded;

    const parsed = this._parseSpecsJson(rowData[specsHeader]);
    if (!parsed) return expanded;

    for (const [key, val] of this._flattenSpecsEntries(parsed)) {
      expanded[key] = this._normalizeSpecValue(val);
    }
    return expanded;
  }

  _formatSpecification(specStr) {
    if (specStr === undefined || specStr === null || specStr === '') return '';

    const jsonObj = this._parseSpecsJson(specStr);
    if (jsonObj) {
      const rows = this._flattenSpecsEntries(jsonObj).map(([key, val]) => {
        const display = this._normalizeSpecValue(val);
        return `<tr><td class="spec-key">${this._escapeHtml(key)}</td><td class="spec-val">${this._escapeHtml(display)}</td></tr>`;
      });
      return `<table class="specs-table"><tbody>${rows.join('')}</tbody></table>`;
    }

    return this._escapeHtml(String(specStr));
  }

  _replacePlaceholders(templateStr, rowData) {
    if (!templateStr) return '';
    const data = this._expandRowData(rowData);

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

      if (trimmedKey.toLowerCase() === 'specification' || trimmedKey.toLowerCase() === 'specs') {
        const specsHeader = Object.keys(rowData).find((h) => {
          const n = h.trim().toLowerCase();
          return n === 'specs' || n === 'specification';
        });
        return this._formatSpecification(specsHeader ? rowData[specsHeader] : value);
      }

      return this._applyHighlights(value);
    });
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
