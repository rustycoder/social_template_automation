/**
 * Export Grid — batch preview tiles with overlay selection.
 */
import { FORMAT_BUCKETS, getPlatformLabelsForBucket } from './socialFormats.js';
import { getDefaultDimensionsForBucket } from './socialPreview.js';

const BUCKET_RATIO_LABELS = {
  square: '1:1',
  portrait: '4:5',
  story: '9:16',
  landscape: '1.91:1',
};

/**
 * @param {Record<string, string>} rowData
 * @param {number} index
 */
function getRowLabel(rowData, index) {
  const preferred = rowData.CODE || rowData.HEADLINE || rowData.headline || rowData.NAME || rowData.name;
  if (preferred) {
    const cleaned = String(preferred).trim();
    if (cleaned) return cleaned.slice(0, 48);
  }
  return `Post ${index + 1}`;
}

export class ExportGrid {
  /**
   * @param {import('../dataSource.js').DataSource} dataSource
   * @param {import('./socialPreview.js').SocialPreview} preview
   * @param {object} callbacks
   */
  constructor(dataSource, preview, callbacks) {
    this.dataSource = dataSource;
    this.preview = preview;
    this.getTemplate = callbacks.getTemplate;
    this.getBucketCss = callbacks.getBucketCss;
    this.getMediaType = callbacks.getMediaType;
    this.getCurrentBucket = callbacks.getCurrentBucket;
    this.onSelectionChange = callbacks.onSelectionChange ?? (() => {});

    this.checkedRowIndices = new Set();
    this.gridEl = document.getElementById('export-ratio-grid');
  }

  /**
   * @param {object} template
   * @param {string} bucket
   * @param {string} mediaType
   * @returns {boolean}
   */
  _isBucketAvailable(template, bucket, mediaType) {
    const layout = template.layouts[bucket];
    if (!layout) return false;

    const platformLabels = getPlatformLabelsForBucket(bucket, mediaType);
    if (platformLabels.length === 0) return false;
    if (mediaType === 'video') return !!layout.animation;
    return true;
  }

  resetRowSelection() {
    this.checkedRowIndices.clear();
  }

  _syncCheckedRows(rowCount) {
    for (const index of [...this.checkedRowIndices]) {
      if (index >= rowCount) {
        this.checkedRowIndices.delete(index);
      }
    }

    for (let i = 0; i < rowCount; i++) {
      if (!this.checkedRowIndices.has(i)) {
        this.checkedRowIndices.add(i);
      }
    }
  }

  _getLayoutDimensions(template, bucket) {
    const layout = template.layouts[bucket];
    if (layout?.width && layout?.height) {
      return { width: layout.width, height: layout.height };
    }
    return getDefaultDimensionsForBucket(bucket);
  }

  _buildPostSelect(rowData, rowIndex) {
    const isChecked = this.checkedRowIndices.has(rowIndex);
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'export-post-checkbox';
    input.checked = isChecked;
    input.setAttribute('aria-label', `Select ${getRowLabel(rowData, rowIndex)}`);
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('change', () => {
      if (input.checked) {
        this.checkedRowIndices.add(rowIndex);
      } else {
        this.checkedRowIndices.delete(rowIndex);
      }
      this.onSelectionChange();
    });

    const label = document.createElement('p');
    label.className = 'export-post-label';
    label.textContent = getRowLabel(rowData, rowIndex);

    return { input, label };
  }

  _buildPostTile(bucket, template, rowData, rowIndex, mediaType) {
    const bucketMeta = FORMAT_BUCKETS[bucket];
    const label = bucketMeta?.label ?? bucket;
    const layout = template.layouts[bucket];
    const { width: realW, height: realH } = this._getLayoutDimensions(template, bucket);

    const tile = document.createElement('div');
    tile.className = 'export-post-tile';
    tile.dataset.bucket = bucket;
    tile.dataset.rowIndex = String(rowIndex);

    const box = document.createElement('div');
    box.className = 'ratio-tile-box active export-post-preview-box';

    if (!layout) {
      const empty = document.createElement('div');
      empty.className = 'ratio-tile-empty';
      empty.textContent = `No ${label.toLowerCase()} layout for this template`;
      box.appendChild(empty);
    } else {
      const mount = document.createElement('div');
      mount.className = 'preview-mount ratio-tile-mount';
      box.appendChild(mount);

      const css = this.getBucketCss(bucket);
      requestAnimationFrame(() => {
        this.preview.renderInto(mount, rowData, css, realW, realH);
      });
    }

    tile.appendChild(box);

    const { input, label: nameLabel } = this._buildPostSelect(rowData, rowIndex);
    tile.appendChild(input);
    tile.appendChild(nameLabel);

    return tile;
  }

  render() {
    if (!this.gridEl) return;

    const rows = this.dataSource.getRows();
    const bucket = this.getCurrentBucket();
    const template = this.getTemplate();
    const mediaType = this.getMediaType();

    this.gridEl.dataset.exportBucket = bucket;

    if (rows.length === 0) {
      this.gridEl.innerHTML = '';
      this.checkedRowIndices.clear();
      this.onSelectionChange();
      return;
    }

    this._syncCheckedRows(rows.length);
    this.gridEl.innerHTML = '';

    if (!this._isBucketAvailable(template, bucket, mediaType)) {
      const empty = document.createElement('div');
      empty.className = 'ratio-tile-empty export-grid-empty';
      const bucketLabel = FORMAT_BUCKETS[bucket]?.label ?? bucket;
      empty.textContent = `This template has no ${bucketLabel.toLowerCase()} layout for export.`;
      this.gridEl.appendChild(empty);
      this.onSelectionChange();
      return;
    }

    for (let i = 0; i < rows.length; i++) {
      this.gridEl.appendChild(this._buildPostTile(bucket, template, rows[i], i, mediaType));
    }

    this.onSelectionChange();
  }

  getSelectedBucketIds() {
    const template = this.getTemplate();
    const bucket = this.getCurrentBucket();
    const mediaType = this.getMediaType();
    if (this._isBucketAvailable(template, bucket, mediaType)) {
      return [bucket];
    }
    return [];
  }

  hasSelection() {
    return this.checkedRowIndices.size > 0 && this.getSelectedBucketIds().length > 0;
  }

  getSelectedCount() {
    if (this.getSelectedBucketIds().length === 0) return 0;
    return this.checkedRowIndices.size;
  }

  /**
   * @returns {{ rowData: Record<string, string>, rowIndex: number }[]}
   */
  getSelectedRows() {
    const rows = this.dataSource.getRows();
    return [...this.checkedRowIndices]
      .sort((a, b) => a - b)
      .filter((index) => index < rows.length)
      .map((rowIndex) => ({ rowData: rows[rowIndex], rowIndex }));
  }
}
