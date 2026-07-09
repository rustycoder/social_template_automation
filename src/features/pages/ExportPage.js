/**
 * @file features/pages/ExportPage.js
 * @description Page 3 — export grid rendering, format tag, progress UI, and export button state.
 * @dependencies features/modules/SelectionModule.js, features/rendering/exportGrid.js, features/rendering/exporter.js
 * @state Export progress UI; delegates selection to SelectionModule.
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
   * @description Shows the export progress overlay immediately (synchronous DOM update).
   * @param {number} current Completed units.
   * @param {number} total Total units (0 when unknown).
   * @param {string} message Status message.
   * @returns {void}
   * @private
   */
  _showExportProgress(current, total, message) {
    document.body.classList.add('social-exporting');
    this.progressSection?.classList.remove('hidden');
    if (message && this.progressText) {
      this.progressText.textContent = message;
    }
    if (!this.progressFill) return;

    if (total > 0) {
      const pct = Math.min(100, Math.max(2, (current / total) * 100));
      this.progressFill.style.width = `${pct}%`;
    } else {
      this.progressFill.style.width = current > 0 ? '8%' : '4%';
    }
  }

  /**
   * @description Hides the export progress overlay.
   * @returns {void}
   * @private
   */
  _hideExportProgress() {
    document.body.classList.remove('social-exporting');
    this.progressSection?.classList.add('hidden');
    if (this.progressFill) this.progressFill.style.width = '0%';
  }

  /**
   * @description Runs the export pipeline for selected rows and format buckets.
   * @returns {Promise<void>}
   */
  async handleExport() {
    // Instant feedback on click — before any async subscription/render work.
    this._showExportProgress(0, 0, 'Preparing export…');
    if (this.exportBtn) this.exportBtn.disabled = true;

    const hasSubscription = await this.requireSubscription();
    if (!hasSubscription) {
      this._hideExportProgress();
      this.updateExportButton();
      return;
    }

    const selectedBuckets = this.getSelectedBuckets();
    if (selectedBuckets.length === 0) {
      this._hideExportProgress();
      this.updateExportButton();
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: 'Selected format is not available for this template', type: 'error' },
        })
      );
      return;
    }

    const selectedRows = this.exportGrid.getSelectedRows();
    if (selectedRows.length === 0) {
      this._hideExportProgress();
      this.updateExportButton();
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: 'Select at least one post to export', type: 'error' } })
      );
      return;
    }

    const template = this.getTemplate();
    const getBucketCss = (bucket) => this.getBucketCss(bucket);
    const totalRenders = selectedRows.length * selectedBuckets.length;

    this._showExportProgress(0, totalRenders, `Exporting 0 of ${totalRenders}…`);

    try {
      const onProgress = (current, total, message) => {
        const label =
          message ?? `Exporting ${current} of ${total}…`;
        this._showExportProgress(current, total, label);
      };

      if (this.dataSource.mode === 'single') {
        const { rowData } = selectedRows[0];
        await exportSinglePostPresets(template, rowData, selectedBuckets, onProgress, getBucketCss);
      } else {
        await exportBulkPosts(template, selectedRows, selectedBuckets, onProgress, getBucketCss);
      }

      this._showExportProgress(totalRenders, totalRenders, 'Export complete!');
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: 'Export successful', type: 'success' } })
      );
    } catch (error) {
      console.error('Export error:', error);
      this._showExportProgress(0, totalRenders, `Error: ${error.message}`);
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: `Export failed: ${error.message}`, type: 'error' } })
      );
    } finally {
      this.updateExportButton();
      setTimeout(() => this._hideExportProgress(), 1200);
    }
  }
}
