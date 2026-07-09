/**
 * Export Grid — 4-column ratio tile previews with per-bucket selection.
 */
import { FORMAT_BUCKETS, getPlatformLabelsForBucket } from './socialFormats.js';
import { getDefaultDimensionsForBucket } from './socialPreview.js';

const BUCKET_IDS = ['square', 'portrait', 'story', 'landscape'];

const BUCKET_RATIO_LABELS = {
  square: '1:1',
  portrait: '4:5',
  story: '9:16',
  landscape: '1.91:1',
};

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

    this.currentRow = 0;
    this.checkedBucketIds = new Set();

    this.gridEl = document.getElementById('export-ratio-grid');
    this.rowNavEl = document.getElementById('export-row-nav');
    this.prevRowBtn = document.getElementById('export-row-prev');
    this.nextRowBtn = document.getElementById('export-row-next');
    this.rowIndicator = document.getElementById('export-row-indicator');

    this._bindRowNav();
  }

  _bindRowNav() {
    this.prevRowBtn?.addEventListener('click', () => {
      if (this.currentRow > 0) {
        this.currentRow--;
        this.render();
      }
    });

    this.nextRowBtn?.addEventListener('click', () => {
      const rowCount = this.dataSource.getRowCount();
      if (this.currentRow < rowCount - 1) {
        this.currentRow++;
        this.render();
      }
    });
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

  /**
   * @param {object} template
   * @param {string} mediaType
   * @returns {string[]}
   */
  _getAvailableBuckets(template, mediaType) {
    return BUCKET_IDS.filter((bucket) => this._isBucketAvailable(template, bucket, mediaType));
  }

  /**
   * @param {object} template
   * @param {string} mediaType
   */
  _syncCheckedBuckets(template, mediaType) {
    const availableBuckets = this._getAvailableBuckets(template, mediaType);
    const availableIds = new Set(availableBuckets);

    for (const id of [...this.checkedBucketIds]) {
      if (!availableIds.has(id)) {
        this.checkedBucketIds.delete(id);
      }
    }

    const isSingleVideo = mediaType === 'video' && this.dataSource.mode === 'single';
    if (isSingleVideo) {
      const kept =
        availableBuckets.find((bucket) => this.checkedBucketIds.has(bucket)) ?? availableBuckets[0];
      this.checkedBucketIds.clear();
      if (kept) {
        this.checkedBucketIds.add(kept);
      }
      return;
    }

    for (const id of availableIds) {
      if (!this.checkedBucketIds.has(id)) {
        this.checkedBucketIds.add(id);
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

  _updateRowNav(rowCount) {
    const showNav = this.dataSource.mode === 'bulk' && rowCount > 1;
    this.rowNavEl?.classList.toggle('hidden', !showNav);

    if (!showNav) return;

    if (this.currentRow >= rowCount) {
      this.currentRow = Math.max(0, rowCount - 1);
    }

    const atStart = this.currentRow === 0;
    const atEnd = this.currentRow >= rowCount - 1;

    if (this.rowIndicator) {
      this.rowIndicator.textContent = `Row ${this.currentRow + 1} of ${rowCount}`;
    }
    if (this.prevRowBtn) this.prevRowBtn.disabled = atStart;
    if (this.nextRowBtn) this.nextRowBtn.disabled = atEnd;
  }

  _buildBucketSelect(bucket, template, mediaType) {
    const isSingleVideo = mediaType === 'video' && this.dataSource.mode === 'single';
    const inputType = isSingleVideo ? 'radio' : 'checkbox';
    const inputName = isSingleVideo ? 'export-bucket-video' : 'export-bucket';
    const isChecked = this.checkedBucketIds.has(bucket);
    const bucketLabel = FORMAT_BUCKETS[bucket]?.label ?? bucket;
    const platformLabels = getPlatformLabelsForBucket(bucket, mediaType);

    const strip = document.createElement('div');
    strip.className = 'ratio-control-strip';

    if (platformLabels.length > 0) {
      const tags = document.createElement('div');
      tags.className = 'ratio-platform-tags';
      tags.textContent = platformLabels.join(' · ');
      strip.appendChild(tags);
    }

    const select = document.createElement('label');
    select.className = `ratio-bucket-select${isChecked ? ' selected' : ''}`;
    select.innerHTML = `
      <input type="${inputType}" name="${inputName}" value="${bucket}" ${isChecked ? 'checked' : ''} />
      <span>Include ${bucketLabel}</span>
    `;

    const input = select.querySelector('input');
    input.addEventListener('change', () => {
      if (isSingleVideo) {
        this.checkedBucketIds.clear();
        if (input.checked) {
          this.checkedBucketIds.add(bucket);
        }
        this.gridEl?.querySelectorAll('.ratio-bucket-select input').forEach((el) => {
          if (el !== input) el.checked = false;
        });
        this.gridEl?.querySelectorAll('.ratio-bucket-select').forEach((el) => {
          el.classList.toggle('selected', el.querySelector('input')?.checked);
        });
      } else if (input.checked) {
        this.checkedBucketIds.add(bucket);
        select.classList.add('selected');
      } else {
        this.checkedBucketIds.delete(bucket);
        select.classList.remove('selected');
      }
      this.onSelectionChange();
    });

    strip.appendChild(select);
    return strip;
  }

  _buildTile(bucket, template, rowData, mediaType) {
    const bucketMeta = FORMAT_BUCKETS[bucket];
    const label = bucketMeta?.label ?? bucket;
    const ratioLabel = BUCKET_RATIO_LABELS[bucket] ?? '';
    const layout = template.layouts[bucket];
    const { width: realW, height: realH } = this._getLayoutDimensions(template, bucket);

    const tile = document.createElement('div');
    tile.className = 'ratio-tile';
    tile.dataset.bucket = bucket;

    const labelRow = document.createElement('div');
    labelRow.className = 'ratio-tile-label';
    labelRow.innerHTML = `<span class="ratio-tile-name">${label}</span><span class="ratio-tile-ratio">${ratioLabel}</span>`;

    const currentBucket = this.getCurrentBucket();
    const box = document.createElement('div');
    box.className = `ratio-tile-box${bucket === currentBucket ? ' active' : ''}`;

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

    tile.appendChild(labelRow);
    tile.appendChild(box);

    if (this._isBucketAvailable(template, bucket, mediaType)) {
      tile.appendChild(this._buildBucketSelect(bucket, template, mediaType));
    } else {
      const strip = document.createElement('div');
      strip.className = 'ratio-control-strip ratio-control-strip--empty';
      tile.appendChild(strip);
    }

    return tile;
  }

  render() {
    if (!this.gridEl) return;

    const rowCount = this.dataSource.getRowCount();
    if (rowCount === 0) {
      this.gridEl.innerHTML = '';
      this._updateRowNav(0);
      this.onSelectionChange();
      return;
    }

    if (this.currentRow >= rowCount) {
      this.currentRow = rowCount - 1;
    }

    const template = this.getTemplate();
    const mediaType = this.getMediaType();
    const rowData = this.dataSource.getRows()[this.currentRow];

    this._syncCheckedBuckets(template, mediaType);
    this._updateRowNav(rowCount);

    this.gridEl.innerHTML = '';
    for (const bucket of BUCKET_IDS) {
      this.gridEl.appendChild(this._buildTile(bucket, template, rowData, mediaType));
    }

    this.onSelectionChange();
  }

  getSelectedBucketIds() {
    return [...this.checkedBucketIds];
  }

  getSelectedCount() {
    return this.checkedBucketIds.size;
  }
}
