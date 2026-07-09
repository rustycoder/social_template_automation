/**
 * @file features/rendering/exportGrid.js
 * @description Export grid renderer — builds post tiles matching Template Page card dimensions.
 * @dependencies features/components/PostCard.js, features/modules/SelectionModule.js
 * @state Stateless renderer; SelectionModule owns checkedRowIndices.
 */

import { createExportCard, createPostCardPreview } from '../components/PostCard.js';
import { FORMAT_BUCKETS, getPlatformLabelsForBucket } from './socialFormats.js';
import { getDefaultDimensionsForBucket } from './socialPreview.js';

/**
 * @description Derives a display label for an export tile from row data.
 * @param {Record<string, string>} rowData Spreadsheet / form row values.
 * @param {number} index Zero-based row index.
 * @returns {string} Truncated label for the tile footer.
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
   * @description Creates the export grid renderer.
   * @param {import('../domain/dataSource.js').DataSource} dataSource Shared row store.
   * @param {import('./socialPreview.js').SocialPreview} preview Live preview renderer.
   * @param {import('../modules/SelectionModule.js').SelectionModule} selection Selection state module.
   * @param {object} callbacks
   * @param {() => object} callbacks.getTemplate Active template resolver.
   * @param {(bucket: string) => string} callbacks.getBucketCss CSS per bucket.
   * @param {() => string} callbacks.getMediaType Media type ('image').
   * @param {() => string} callbacks.getCurrentBucket Active format bucket.
   */
  constructor(dataSource, preview, selection, callbacks) {
    this.dataSource = dataSource;
    this.preview = preview;
    this.selection = selection;
    this.getTemplate = callbacks.getTemplate;
    this.getBucketCss = callbacks.getBucketCss;
    this.getMediaType = callbacks.getMediaType;
    this.getCurrentBucket = callbacks.getCurrentBucket;

    this.gridEl = document.getElementById('export-ratio-grid');
  }

  /**
   * @description Checks whether a bucket layout is available for export.
   * @param {object} template Template definition object.
   * @param {string} bucket Format bucket id.
   * @returns {boolean}
   * @private
   */
  _isBucketAvailable(template, bucket) {
    const layout = template.layouts[bucket];
    if (!layout) return false;
    return getPlatformLabelsForBucket(bucket, 'image').length > 0;
  }

  /**
   * @description Resolves pixel dimensions for a bucket layout.
   * @param {object} template Template definition object.
   * @param {string} bucket Format bucket id.
   * @returns {{ width: number, height: number }}
   * @private
   */
  _getLayoutDimensions(template, bucket) {
    const layout = template.layouts[bucket];
    if (layout?.width && layout?.height) {
      return { width: layout.width, height: layout.height };
    }
    return getDefaultDimensionsForBucket(bucket);
  }

  /**
   * @description Builds a template-page-style preview container with live render mount.
   * @param {object} template Template definition.
   * @param {string} bucket Format bucket id.
   * @param {Record<string, string>} rowData Row values for placeholder substitution.
   * @returns {HTMLElement} .template-preview-container element.
   * @private
   */
  _buildPreviewContainer(template, bucket, rowData) {
    const bucketMeta = FORMAT_BUCKETS[bucket];
    const label = bucketMeta?.label ?? bucket;
    const layout = template.layouts[bucket];
    const { width: realW, height: realH } = this._getLayoutDimensions(template, bucket);

    const preview = createPostCardPreview({ bucket, showAspectBadge: false });
    const mount = preview.querySelector('.template-preview-mount');

    if (!layout || !mount) {
      mount.innerHTML = `<span class="gallery-preview-unavailable">No ${label.toLowerCase()} layout</span>`;
      return preview;
    }

    const css = this.getBucketCss(bucket);
    requestAnimationFrame(() => {
      this.preview.renderInto(mount, rowData, css, realW, realH);
    });

    return preview;
  }

  /**
   * @description Applies grid classes and bucket data attrs shared with Template Page masonry.
   * @param {string} bucket Active format bucket.
   * @returns {void}
   * @private
   */
  _syncGridLayout(bucket) {
    if (!this.gridEl) return;
    this.gridEl.classList.add('template-masonry', 'export-grid');
    this.gridEl.dataset.exportBucket = bucket;
    this.gridEl.dataset.galleryBucket = bucket;
  }

  /**
   * @description Re-renders all export tiles for the current bucket and row set.
   * @returns {void}
   */
  render() {
    if (!this.gridEl) return;

    const rows = this.dataSource.getRows();
    const bucket = this.getCurrentBucket();
    const template = this.getTemplate();

    this._syncGridLayout(bucket);

    if (rows.length === 0) {
      this.gridEl.innerHTML = '';
      this.selection.reset();
      return;
    }

    this.selection.syncWithRowCount(rows.length);
    this.gridEl.innerHTML = '';

    if (!this._isBucketAvailable(template, bucket)) {
      const empty = document.createElement('div');
      empty.className = 'ratio-tile-empty export-grid-empty';
      const bucketLabel = FORMAT_BUCKETS[bucket]?.label ?? bucket;
      empty.textContent = `This template has no ${bucketLabel.toLowerCase()} layout for export.`;
      this.gridEl.appendChild(empty);
      this.selection.notify();
      return;
    }

    for (let i = 0; i < rows.length; i++) {
      const rowLabel = getRowLabel(rows[i], i);
      const previewContainer = this._buildPreviewContainer(template, bucket, rows[i]);

      const tile = createExportCard({
        rowIndex: i,
        rowLabel,
        bucket,
        checked: this.selection.isRowChecked(i),
        previewContainer,
        onCheckChange: (rowIndex, checked) => {
          this.selection.setRowChecked(rowIndex, checked);
        },
      });

      this.gridEl.appendChild(tile);
    }

    this.selection.notify();
  }

  /**
   * @description Returns bucket ids available for export.
   * @returns {string[]}
   */
  getSelectedBucketIds() {
    const template = this.getTemplate();
    const bucket = this.getCurrentBucket();
    if (this._isBucketAvailable(template, bucket)) {
      return [bucket];
    }
    return [];
  }

  /**
   * @description Whether export can proceed (selection + bucket availability).
   * @returns {boolean}
   */
  hasSelection() {
    return this.selection.hasSelection() && this.getSelectedBucketIds().length > 0;
  }

  /**
   * @description Count of selected rows when bucket is available.
   * @returns {number}
   */
  getSelectedCount() {
    if (this.getSelectedBucketIds().length === 0) return 0;
    return this.selection.getSelectedCount();
  }

  /**
   * @description Returns selected row payloads for the exporter.
   * @returns {{ rowData: Record<string, string>, rowIndex: number }[]}
   */
  getSelectedRows() {
    return this.selection.getSelectedRows(this.dataSource.getRows());
  }
}
