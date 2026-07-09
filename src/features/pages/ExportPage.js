/**
 * @file features/pages/ExportPage.js
 * @description Page 3 — export grid rendering, format tag, progress UI, and export button state.
 * @dependencies features/modules/SelectionModule.js, features/rendering/exportGrid.js, features/rendering/exporter.js
 * @state Export progress RAF handle; delegates selection to SelectionModule.
 */

import { FORMAT_BUCKETS } from '../rendering/socialFormats.js';
import { BUCKET_RATIO_LABELS } from '../shared/constants.js';
import {
  exportBulkPosts,
  exportSinglePostPresets,
} from '../rendering/exporter.js';

export class ExportPage {
  /**
   * @description Creates the Export Page controller.
   * @param {import('../modules/SelectionModule.js').SelectionModule} selection Selection state module.
   * @param {import('../rendering/exportGrid.js').ExportGrid} exportGrid Tile renderer.
   * @param {import('../domain/dataSource.js').DataSource} dataSource Shared row store.
   * @param {object} deps
   * @param {() => object} deps.getTemplate Active template resolver.
   * @param {() => string} deps.getCurrentBucket Active format bucket.
   * @param {(bucket: string) => string} deps.getBucketCss CSS resolver per bucket.
   * @param {() => string[]} deps.getSelectedBuckets Available export buckets.
   * @param {() => Promise<boolean>} deps.requireSubscription Subscription gate before download.
   */
  constructor(selection, exportGrid, dataSource, deps) {
    this.selection = selection;
    this.exportGrid = exportGrid;
    this.dataSource = dataSource;
    this.getTemplate = deps.getTemplate;
    this.getCurrentBucket = deps.getCurrentBucket;
    this.getBucketCss = deps.getBucketCss;
    this.getSelectedBuckets = deps.getSelectedBuckets;
    this.requireSubscription = deps.requireSubscription;

    this.progressSection = document.getElementById('progress-section');
    this.progressFill = document.getElementById('progress-fill');
    this.progressText = document.getElementById('progress-text');
    this.exportBtn = document.getElementById('btn-export');
    this.formatTag = document.getElementById('export-format-tag');

    /** @type {number | null} */
    this._progressRaf = null;

    /** @type {{ current: number, total: number, message: string } | null} */
    this._pendingProgress = null;

    this.exportBtn?.addEventListener('click', () => this.handleExport());
  }

  /**
   * @description Syncs the export format tag in the page header.
   * @returns {void}
   */
  syncFormatTag() {
    if (!this.formatTag) return;

    const bucket = this.getCurrentBucket();
    const bucketLabel = FORMAT_BUCKETS[bucket]?.label ?? bucket;
    const ratio = BUCKET_RATIO_LABELS[bucket] ?? '';
    this.formatTag.textContent = ratio ? `${bucketLabel} · ${ratio}` : bucketLabel;
  }

  /**
   * @description Updates the primary export button label and disabled state from selection count.
   * @returns {void}
   */
  updateExportButton() {
    if (!this.exportBtn) return;

    const selectedCount = this.selection.getSelectedCount();
    const buckets = this.getSelectedBuckets();

    if (buckets.length === 0 || selectedCount === 0) {
      this.exportBtn.textContent = 'Export Selected (0)';
      this.exportBtn.disabled = buckets.length === 0 || selectedCount === 0;
      return;
    }

    this.exportBtn.textContent = `Export Selected (${selectedCount})`;
    this.exportBtn.disabled = false;
    this.syncFormatTag();
  }

  /**
   * @description Resets selection and re-renders the export grid (on step enter).
   * @returns {void}
   */
  onEnter() {
    this.selection.reset();
    this.syncFormatTag();
    setTimeout(() => {
      this.exportGrid.render();
    }, 50);
  }

  /**
   * @description Throttled progress bar update via requestAnimationFrame.
   * @param {number} current Completed units.
   * @param {number} total Total units.
   * @param {string} message Status message.
   * @returns {void}
   * @private
   */
  _setExportProgress(current, total, message) {
    this._pendingProgress = { current, total, message };
    if (this._progressRaf) return;
    this._progressRaf = requestAnimationFrame(() => {
      this._progressRaf = null;
      const progress = this._pendingProgress;
      if (!progress) return;
      if (progress.message) this.progressText.textContent = progress.message;
      if (progress.total > 0) {
        this.progressFill.style.width = `${(progress.current / progress.total) * 90}%`;
      }
    });
  }

  /**
   * @description Runs the export pipeline for selected rows and format buckets.
   * @returns {Promise<void>}
   */
  async handleExport() {
    const hasSubscription = await this.requireSubscription();
    if (!hasSubscription) return;

    const selectedBuckets = this.getSelectedBuckets();
    if (selectedBuckets.length === 0) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: 'Selected format is not available for this template', type: 'error' },
        })
      );
      return;
    }

    const selectedRows = this.exportGrid.getSelectedRows();
    if (selectedRows.length === 0) {
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: 'Select at least one post to export', type: 'error' } })
      );
      return;
    }

    const template = this.getTemplate();
    const getBucketCss = (bucket) => this.getBucketCss(bucket);

    document.body.classList.add('social-exporting');
    this.progressSection?.classList.remove('hidden');
    this.progressFill.style.width = '0%';
    this.progressText.textContent = 'Preparing export…';
    this.exportBtn.disabled = true;

    try {
      if (this.dataSource.mode === 'single') {
        const { rowData } = selectedRows[0];
        await exportSinglePostPresets(
          template,
          rowData,
          selectedBuckets,
          (c, t, m) => this._setExportProgress(c, t, m),
          getBucketCss
        );
      } else {
        await exportBulkPosts(
          template,
          selectedRows,
          selectedBuckets,
          (c, t, m) => this._setExportProgress(c, t, m),
          getBucketCss
        );
      }

      this.progressFill.style.width = '100%';
      this.progressText.textContent = 'Export complete!';
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: 'Export successful', type: 'success' } })
      );
    } catch (error) {
      console.error('Export error:', error);
      this.progressText.textContent = `Error: ${error.message}`;
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: `Export failed: ${error.message}`, type: 'error' } })
      );
    } finally {
      if (this._progressRaf) {
        cancelAnimationFrame(this._progressRaf);
        this._progressRaf = null;
      }
      this.exportBtn.disabled = false;
      this.updateExportButton();
      setTimeout(() => {
        document.body.classList.remove('social-exporting');
        this.progressSection?.classList.add('hidden');
      }, 1200);
    }
  }
}
