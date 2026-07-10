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

/**
 * @description Formats milliseconds into a short human-readable duration.
 * @param {number} ms
 * @returns {string}
 */
function formatEta(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '';

  const sec = Math.ceil(ms / 1000);
  if (sec < 5) return 'less than 5 sec remaining';
  if (sec < 60) return `~${sec} sec remaining`;

  const min = Math.ceil(sec / 60);
  if (min < 60) return min === 1 ? '~1 min remaining' : `~${min} min remaining`;

  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  return remMin > 0 ? `~${hr} hr ${remMin} min remaining` : `~${hr} hr remaining`;
}

/**
 * @description Builds the export progress label with file count and ETA.
 * @param {number} current Completed file count.
 * @param {number} total Total files to export.
 * @param {number | null} startedAt Export start timestamp (ms).
 * @param {string} [detailMessage] Optional status from the exporter.
 * @returns {string}
 */
function buildExportProgressLabel(current, total, startedAt, detailMessage = '') {
  const detail = detailMessage.toLowerCase();

  if (detail.includes('preparing')) {
    return detailMessage || 'Preparing export…';
  }

  if (detail.includes('packaging')) {
    return 'Packaging files… · almost done';
  }

  if (detail.includes('complete') && current >= total) {
    return 'Export complete!';
  }

  if (total <= 0) {
    return 'Preparing export…';
  }

  const completed = Math.min(Math.max(0, current), total);
  const remaining = Math.max(0, total - completed);

  let label = `${completed}/${total} completed`;
  if (remaining > 0) {
    label += ` · ${remaining} more to go`;
  }

  if (startedAt && completed > 0 && remaining > 0) {
    const elapsed = Date.now() - startedAt;
    const eta = formatEta((elapsed / completed) * remaining);
    if (eta) label += ` · ${eta}`;
  } else if (remaining > 0 && completed === 0) {
    label += ' · estimating time…';
  }

  return label;
}

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
    this.exportCountEl = this.exportBtn?.querySelector('.btn-export-count');
    this.formatTag = document.getElementById('export-format-tag');
    this._exportStartedAt = null;

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

    if (this.exportCountEl) {
      this.exportCountEl.textContent = `(${selectedCount})`;
    }

    if (buckets.length === 0 || selectedCount === 0) {
      this.exportBtn.disabled = buckets.length === 0 || selectedCount === 0;
      this.exportBtn.setAttribute('aria-label', `Export selected (${selectedCount})`);
      return;
    }

    this.exportBtn.disabled = false;
    this.exportBtn.setAttribute('aria-label', `Export selected (${selectedCount})`);
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
    if (this.progressText) {
      this.progressText.textContent =
        message ??
        buildExportProgressLabel(current, total, this._exportStartedAt);
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
   * @description Updates progress with file count and estimated time remaining.
   * @param {number} current Completed units.
   * @param {number} total Total units.
   * @param {string} [detailMessage] Optional exporter status detail.
   * @returns {void}
   * @private
   */
  _updateExportProgress(current, total, detailMessage = '') {
    const label = buildExportProgressLabel(current, total, this._exportStartedAt, detailMessage);
    this._showExportProgress(current, total, label);
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
    this._exportStartedAt = null;
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

    this._exportStartedAt = Date.now();
    this._updateExportProgress(0, totalRenders);

    try {
      const onProgress = (current, total, detailMessage) => {
        this._updateExportProgress(current, total, detailMessage);
      };

      if (this.dataSource.mode === 'single') {
        const { rowData } = selectedRows[0];
        await exportSinglePostPresets(template, rowData, selectedBuckets, onProgress, getBucketCss);
      } else {
        await exportBulkPosts(template, selectedRows, selectedBuckets, onProgress, getBucketCss);
      }

      this._updateExportProgress(totalRenders, totalRenders, 'Export complete');
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: 'Export successful', type: 'success' } })
      );
    } catch (error) {
      console.error('Export error:', error);
      this._showExportProgress(0, totalRenders, `Export failed: ${error.message}`);
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: `Export failed: ${error.message}`, type: 'error' } })
      );
    } finally {
      this.updateExportButton();
      setTimeout(() => this._hideExportProgress(), 1200);
    }
  }
}
