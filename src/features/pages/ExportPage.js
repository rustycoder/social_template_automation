/**
 * @file features/pages/ExportPage.js
 * @description Page 3 — export grid, download, and save-to-library flows.
 */

import { FORMAT_BUCKETS } from '../rendering/socialFormats.js';
import { BUCKET_RATIO_LABELS } from '../shared/constants.js';
import { POST_CAPTION_KEY } from '../shared/postMeta.js';
import {
  exportBulkPosts,
  exportSinglePostPresets,
} from '../rendering/exporter.js';
import { exportBucketImage } from '../rendering/socialExporter.js';
import { api, ApiError } from '../auth/api.js';

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

function findCaption(rowData) {
  if (!rowData) return '';
  if (rowData[POST_CAPTION_KEY] != null) return String(rowData[POST_CAPTION_KEY]);
  const key = Object.keys(rowData).find((k) => k.toLowerCase() === 'caption');
  return key ? String(rowData[key] ?? '') : '';
}

export class ExportPage {
  /**
   * @param {import('../modules/SelectionModule.js').SelectionModule} selection
   * @param {import('../rendering/exportGrid.js').ExportGrid} exportGrid
   * @param {import('../domain/dataSource.js').DataSource} dataSource
   * @param {object} deps
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
    this.getTemplateId = deps.getTemplateId;

    this.progressSection = document.getElementById('progress-section');
    this.progressFill = document.getElementById('progress-fill');
    this.progressText = document.getElementById('progress-text');
    this.exportBtn = document.getElementById('btn-export');
    this.saveBtn = document.getElementById('btn-save-post');
    this.exportCountEl = this.exportBtn?.querySelector('.btn-export-count');
    this.saveCountEl = this.saveBtn?.querySelector('.btn-save-count');
    this.formatTag = document.getElementById('export-format-tag');
    this._exportStartedAt = null;

    this.saveOverlay = document.getElementById('save-post-modal-overlay');
    this.saveCaptionPreview = document.getElementById('save-caption-preview');
    this.savePlatform = document.getElementById('save-platform');
    this.saveDate = document.getElementById('save-date');
    this.saveTime = document.getElementById('save-time');
    this.saveError = document.getElementById('save-post-error');
    this.saveConfirmBtn = document.getElementById('save-post-confirm');
    this.saveCloseBtn = document.getElementById('save-post-modal-close');

    /** @type {{ rowData: object, index: number } | null} */
    this._pendingSaveRow = null;

    this.exportBtn?.addEventListener('click', () => this.handleExport());
    this.saveBtn?.addEventListener('click', () => this.handleSaveClick());
    this.saveCloseBtn?.addEventListener('click', () => this._closeSaveModal());
    this.saveOverlay?.addEventListener('click', (e) => {
      if (e.target === this.saveOverlay) this._closeSaveModal();
    });
    this.saveConfirmBtn?.addEventListener('click', () => this._confirmSave());
  }

  syncFormatTag() {
    if (!this.formatTag) return;

    const bucket = this.getCurrentBucket();
    const bucketLabel = FORMAT_BUCKETS[bucket]?.label ?? bucket;
    const ratio = BUCKET_RATIO_LABELS[bucket] ?? '';
    this.formatTag.textContent = ratio ? `${bucketLabel} · ${ratio}` : bucketLabel;
  }

  updateExportButton() {
    const selectedCount = this.selection.getSelectedCount();
    const buckets = this.getSelectedBuckets();
    const disabled = buckets.length === 0 || selectedCount === 0;

    if (this.exportCountEl) {
      this.exportCountEl.textContent = `(${selectedCount})`;
    }
    if (this.saveCountEl) {
      this.saveCountEl.textContent = `(${selectedCount})`;
    }

    if (this.exportBtn) {
      this.exportBtn.disabled = disabled;
      this.exportBtn.setAttribute('aria-label', `Download selected (${selectedCount})`);
    }
    if (this.saveBtn) {
      this.saveBtn.disabled = disabled;
      this.saveBtn.setAttribute('aria-label', `Save selected (${selectedCount})`);
    }

    if (!disabled) {
      this.syncFormatTag();
    }
  }

  onEnter() {
    this.selection.reset();
    this.syncFormatTag();
    setTimeout(() => {
      this.exportGrid.render();
    }, 50);
  }

  _showExportProgress(current, total, message) {
    document.body.classList.add('social-exporting');
    this.progressSection?.classList.remove('hidden');
    if (this.progressText) {
      this.progressText.textContent =
        message ?? buildExportProgressLabel(current, total, this._exportStartedAt);
    }
    if (!this.progressFill) return;

    if (total > 0) {
      const pct = Math.min(100, Math.max(2, (current / total) * 100));
      this.progressFill.style.width = `${pct}%`;
    } else {
      this.progressFill.style.width = current > 0 ? '8%' : '4%';
    }
  }

  _updateExportProgress(current, total, detailMessage = '') {
    const label = buildExportProgressLabel(current, total, this._exportStartedAt, detailMessage);
    this._showExportProgress(current, total, label);
  }

  _hideExportProgress() {
    document.body.classList.remove('social-exporting');
    this.progressSection?.classList.add('hidden');
    if (this.progressFill) this.progressFill.style.width = '0%';
    this._exportStartedAt = null;
  }

  async handleExport() {
    this._showExportProgress(0, 0, 'Preparing export…');
    if (this.exportBtn) this.exportBtn.disabled = true;
    if (this.saveBtn) this.saveBtn.disabled = true;

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
        new CustomEvent('toast', { detail: { message: 'Download successful', type: 'success' } })
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

  async handleSaveClick() {
    const hasSubscription = await this.requireSubscription();
    if (!hasSubscription) return;

    const selectedBuckets = this.getSelectedBuckets();
    const selectedRows = this.exportGrid.getSelectedRows();

    if (selectedBuckets.length === 0 || selectedRows.length === 0) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: 'Select at least one post to save', type: 'error' },
        })
      );
      return;
    }

    if (selectedRows.length > 1) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: 'Select one post at a time to save',
            type: 'error',
          },
        })
      );
      return;
    }

    this._pendingSaveRow = selectedRows[0];
    const caption = findCaption(this._pendingSaveRow.rowData);
    if (this.saveCaptionPreview) {
      this.saveCaptionPreview.textContent = caption.trim() || '(No caption provided)';
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    if (this.saveDate) {
      this.saveDate.value = now.toISOString().slice(0, 10);
    }
    if (this.saveTime) {
      this.saveTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
    if (this.saveError) {
      this.saveError.textContent = '';
      this.saveError.classList.add('hidden');
    }

    this.saveOverlay?.classList.remove('hidden');
  }

  _closeSaveModal() {
    this.saveOverlay?.classList.add('hidden');
    this._pendingSaveRow = null;
  }

  async _confirmSave() {
    if (!this._pendingSaveRow) return;

    const platform = this.savePlatform?.value;
    const date = this.saveDate?.value;
    const time = this.saveTime?.value;

    if (!platform || !date || !time) {
      if (this.saveError) {
        this.saveError.textContent = 'Platform, date, and time are required';
        this.saveError.classList.remove('hidden');
      }
      return;
    }

    const scheduledAt = new Date(`${date}T${time}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      if (this.saveError) {
        this.saveError.textContent = 'Invalid date or time';
        this.saveError.classList.remove('hidden');
      }
      return;
    }

    if (this.saveConfirmBtn) this.saveConfirmBtn.disabled = true;
    this._showExportProgress(0, 1, 'Rendering post…');

    try {
      const template = this.getTemplate();
      const bucket = this.getCurrentBucket();
      const { rowData } = this._pendingSaveRow;
      const { blob } = await exportBucketImage(
        template,
        rowData,
        bucket,
        (b) => this.getBucketCss(b)
      );

      const formData = new FormData();
      formData.append('image', blob, 'post.png');
      formData.append('template_id', this.getTemplateId() || template.id);
      formData.append('caption', findCaption(rowData));
      formData.append('platform', platform);
      formData.append('scheduled_at', scheduledAt.toISOString());
      formData.append('format_bucket', bucket);
      formData.append('field_data', JSON.stringify(rowData));

      await api.createPost(formData);

      this._closeSaveModal();
      this._updateExportProgress(1, 1, 'Export complete');
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: 'Post saved to your library', type: 'success' },
        })
      );
    } catch (error) {
      console.error('Save post error:', error);
      const message =
        error instanceof ApiError ? error.message : error.message || 'Failed to save post';
      if (this.saveError) {
        this.saveError.textContent = message;
        this.saveError.classList.remove('hidden');
      }
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message, type: 'error' } })
      );
    } finally {
      if (this.saveConfirmBtn) this.saveConfirmBtn.disabled = false;
      this.updateExportButton();
      setTimeout(() => this._hideExportProgress(), 800);
    }
  }
}
