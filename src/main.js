/**
 * Social Media Template Automation — unified social post generator
 */
import './style.css';
import { TemplateStore } from './modules/templateStore.js';
import { TemplateEditor } from './modules/templateEditor.js';
import { DataSource } from './modules/dataSource.js';
import { UploadStep } from './modules/uploadStep.js';
import { PostPreview, getDefaultDimensionsForBucket } from './modules/preview.js';
import { renderGalleryPreview } from './modules/templateGalleryPreview.js';
import { getSampleRowForTemplate } from './modules/templateSampleData.js';
import { FORMAT_BUCKETS, getPlatformLabelsForBucket } from './modules/social/socialFormats.js';
import {
  exportBulkPosts,
  exportSinglePostPresets,
} from './modules/exporter.js';
import { ExportGrid } from './modules/social/exportGrid.js';
import { authService } from './modules/auth.js';
import { handleCheckoutReturn } from './modules/checkout.js';
import { AuthUI } from './modules/authUI.js';
import { SubscriptionUI } from './modules/subscriptionUI.js';
import { BillingUI } from './modules/billingUI.js';

const BUCKET_IDS = ['square', 'portrait', 'story', 'landscape'];

class App {
  constructor() {
    this.currentStep = 1;
    this.templateStore = new TemplateStore();
    this.dataSource = new DataSource();
    this.currentTemplateKey = this.templateStore.getDefaultTemplateId();
    this.currentBucket = 'square';
    this.galleryBucket = 'square';
    this.templateSearchQuery = '';
    this.templateGalleryLimit = 12;
    this._progressRaf = null;

    this.editorStore = this._createEditorStoreAdapter();
    this.templateEditor = new TemplateEditor(this.editorStore, {
      htmlContainerId: 'html-editor-container',
      cssContainerId: 'css-editor-container',
      tagsListId: 'tags-list',
      templateSelectId: 'template-select-hidden',
      saveTemplateBtnId: 'btn-save-template',
      tabBtnsSelector: '#customize-panel .tab-switcher .tab-btn',
      codeEditorsSelector: '#customize-panel .code-editor-wrapper .code-editor',
      defaultTemplateKey: this.currentTemplateKey,
    });

    this.preview = new PostPreview(
      this.dataSource,
      this.templateEditor,
      () => this.currentBucket,
      () => this._getCurrentLayoutDimensions()
    );

    this.exportGrid = new ExportGrid(this.dataSource, this.preview, {
      getTemplate: () => this._getExportTemplate(),
      getBucketCss: (bucket) => this._getBucketCss(bucket),
      getMediaType: () => 'image',
      getCurrentBucket: () => this.currentBucket,
      onSelectionChange: () => this._updateExportCount(),
    });

    this.dataPreview = new PostPreview(
      this.dataSource,
      this.templateEditor,
      () => this.currentBucket,
      () => this._getCurrentLayoutDimensions(),
      {
        mountId: 'data-preview-mount',
        frameWrapperId: 'data-preview-frame-wrapper',
        navId: 'data-preview-nav',
        prevRowBtnId: 'data-btn-prev-row',
        nextRowBtnId: 'data-btn-next-row',
        rowIndicatorId: 'data-preview-row-indicator',
        formatTagId: 'data-preview-format-tag',
        skipWrapperAspectRatio: true,
      }
    );

    this.uploadStep = new UploadStep(this.dataSource, () => this.templateStore.getTemplate(this.currentTemplateKey));

    this.templateEditor.onContentChange = () => {
      if (this.currentStep === 3) {
        this.exportGrid.render();
      }
      if (this.currentStep === 2) {
        this._updateDataStepPreview();
      }
    };

    this.uploadStep.onContinue = () => this._enterExportStep();
    this.uploadStep.onDataChange = () => this._updateDataStepPreview();

    this.authUI = new AuthUI();
    this.subscriptionUI = new SubscriptionUI(this.authUI);
    this.billingUI = new BillingUI(this.authUI);
    this.authUI.onBillingClick = () => this.billingUI.show();

    this._bindNavigation();
    this._bindTemplateStep();
    this._bindExportUI();
    this._bindBucketTabs();
    this._bindToast();
    this._renderTemplateGallery();
    this._selectInitialBucket(this.currentTemplateKey);
    this.templateEditor.selectTemplate(this.currentTemplateKey);
    this._selectTemplate(this.currentTemplateKey);
    this._syncFooter(1);
  }

  _createEditorStoreAdapter() {
    const self = this;
    return {
      getTemplate(key) {
        const template = self.templateStore.getTemplate(key || self.currentTemplateKey);
        const layout = template.layouts[self.currentBucket];
        return {
          name: template.name,
          html: template.content?.html ?? '',
          css: layout?.css ?? '',
        };
      },
      saveTemplate(key, html, css) {
        const template = self.templateStore.getTemplate(key);
        template.content = template.content || { html: '' };
        template.content.html = html;
        const bucket = self.currentBucket;
        if (!template.layouts[bucket]) {
          const dims = getDefaultDimensionsForBucket(bucket);
          template.layouts[bucket] = { css, width: dims.width, height: dims.height };
        } else {
          template.layouts[bucket].css = css;
        }
        self.templateStore.saveTemplate(key, { ...template, id: key });
        self.currentTemplateKey = key;
        self.templateEditor.currentTemplateKey = key;
        self._renderTemplateGallery();
      },
    };
  }

  _bindNavigation() {
    document.querySelectorAll('.step-node').forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.dataset.step, 10);
        if (step <= this._getMaxAccessibleStep()) {
          this._goToStep(step);
        }
      });
    });

    document.getElementById('btn-back-template')?.addEventListener('click', () => this._goToStep(1));
    document.getElementById('btn-back-data')?.addEventListener('click', () => this._goToStep(2));
  }

  _bindTemplateStep() {
    this.templateGrid = document.getElementById('template-grid');
    this.templateSearchInput = document.getElementById('template-search');
    this.loadMoreBtn = document.getElementById('btn-load-more-templates');
    this.galleryFormatTabBtns = document.querySelectorAll('#template-format-tabs [data-gallery-bucket]');

    this.templateSearchInput?.addEventListener('input', () => {
      this.templateSearchQuery = this.templateSearchInput.value.trim().toLowerCase();
      this.templateGalleryLimit = 12;
      this._renderTemplateGallery();
    });

    this.loadMoreBtn?.addEventListener('click', () => {
      this.templateGalleryLimit += 12;
      this._renderTemplateGallery();
    });

    this.galleryFormatTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const bucket = btn.dataset.galleryBucket;
        if (!bucket || bucket === this.galleryBucket) return;
        this.galleryBucket = bucket;
        this.templateGalleryLimit = 12;
        this._syncGalleryFormatTabs();
        this._renderTemplateGallery();
      });
    });
  }

  _syncGalleryFormatTabs() {
    this.galleryFormatTabBtns?.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.galleryBucket === this.galleryBucket);
    });
  }

  _goToDataStep() {
    this.uploadStep.rebuildFormForTemplate();
    this.templateEditor.selectTemplate(this.currentTemplateKey);
    const desc = document.getElementById('data-step-desc');
    if (desc) {
      const template = this.templateStore.getTemplate(this.currentTemplateKey);
      desc.textContent = `Fill in fields for "${template.name}" or upload Excel with matching column names.`;
    }
    this._goToStep(2);
  }

  _renderTemplateGallery() {
    if (!this.templateGrid) return;

    const allKeys = this.templateStore.getVisibleTemplateKeys();
    const filteredKeys = allKeys.filter((key) => {
      if (!this.templateSearchQuery) return true;
      const template = this.templateStore.getTemplate(key);
      return template.name.toLowerCase().includes(this.templateSearchQuery);
    });

    const visibleKeys = filteredKeys.slice(0, this.templateGalleryLimit);
    const hasMore = filteredKeys.length > visibleKeys.length;

    this.templateGrid.innerHTML = '';
    this.templateGrid.dataset.galleryBucket = this.galleryBucket;
    this._syncGalleryFormatTabs();

    if (filteredKeys.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'template-page__empty';
      empty.textContent = this.templateSearchQuery
        ? 'No templates match your search.'
        : 'No templates available.';
      this.templateGrid.appendChild(empty);
      this.loadMoreBtn?.classList.add('hidden');
      return;
    }

    const ratioLabels = { square: '1:1', portrait: '4:5', story: '9:16', landscape: '1.91:1' };
    const aspectLabel = ratioLabels[this.galleryBucket] ?? '';

    for (const key of visibleKeys) {
      const template = this.templateStore.getTemplate(key);
      const hasLayout = template.layouts?.[this.galleryBucket] != null;
      const card = document.createElement('div');
      card.className = `template-card${hasLayout ? '' : ' template-card--unavailable'}`;
      card.dataset.template = key;
      if (key === this.currentTemplateKey && hasLayout) {
        card.classList.add('selected');
      }

      card.innerHTML = `
        <div class="template-preview-container">
          <span class="template-aspect-badge">${aspectLabel}</span>
          <div class="template-preview-mount" data-template-id="${key}"></div>
        </div>
        <div class="template-card-body">
          <h4>${template.name}</h4>
        </div>
      `;

      if (hasLayout) {
        card.addEventListener('click', () => {
          this._selectTemplate(key);
          this._goToDataStep();
        });
      }

      this.templateGrid.appendChild(card);

      const previewMount = card.querySelector('.template-preview-mount');
      if (hasLayout) {
        renderGalleryPreview(template, previewMount, { bucket: this.galleryBucket });
      } else {
        previewMount.innerHTML =
          '<span class="gallery-preview-unavailable">Not available in this format</span>';
      }
    }

    if (this.loadMoreBtn) {
      this.loadMoreBtn.classList.toggle('hidden', !hasMore);
    }
  }

  /**
   * @param {string} key
   */
  _selectTemplate(key) {
    this.currentTemplateKey = key;
    this.templateEditor.currentTemplateKey = key;
    this.currentBucket = this.galleryBucket;
    this.templateEditor.selectTemplate(key);

    this.templateGrid?.querySelectorAll('.template-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.template === key);
    });
  }

  _bindBucketTabs() {
    this.bucketTabBtns = document.querySelectorAll('#bucket-tabs .bucket-tab-btn');
    this.bucketTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => this._onBucketTabClick(btn.dataset.bucket));
    });
  }

  _bindExportUI() {
    this.progressSection = document.getElementById('progress-section');
    this.progressFill = document.getElementById('progress-fill');
    this.progressText = document.getElementById('progress-text');
    this.exportBtn = document.getElementById('btn-export');

    this.exportBtn?.addEventListener('click', () => this._handleExport());
  }

  _getMaxAccessibleStep() {
    if (!this.currentTemplateKey) return 1;
    if (this.dataSource.getRowCount() === 0) return 2;
    return 3;
  }

  _syncFooter(step) {
    const app = document.getElementById('app');
    const footer = document.getElementById('app-footer');
    if (app) app.dataset.activeStep = String(step);

    footer?.querySelectorAll('.footer-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.footerStep === String(step));
    });
  }

  _goToStep(step) {
    this.currentStep = step;

    document.querySelectorAll('.step-panel').forEach((panel) => panel.classList.remove('active'));
    document.getElementById(`step-${step}`)?.classList.add('active');

    document.querySelectorAll('.step-node').forEach((btn) => {
      const btnStep = parseInt(btn.dataset.step, 10);
      btn.classList.remove('active', 'completed');
      if (btnStep === step) btn.classList.add('active');
      else if (btnStep < step) btn.classList.add('completed');
    });

    this._syncFooter(step);

    if (step === 2) {
      this.templateEditor.selectTemplate(this.currentTemplateKey);
      setTimeout(() => {
        this._updateDataStepPreview();
        requestAnimationFrame(() => {
          const { width, height } = this._getCurrentLayoutDimensions();
          this.dataPreview._fitPreviewMount(this.dataPreview.previewMount, width, height);
        });
      }, 50);
    } else if (step === 3) {
      this.templateEditor.setHeaders(this.dataSource.getHeaders());
      this.exportGrid.resetRowSelection();
      this._syncBucketTabs();
      this._syncExportFormatTag();
      setTimeout(() => {
        this.exportGrid.render();
      }, 50);
    }
  }

  _updateDataStepPreview() {
    const hint = document.getElementById('data-preview-hint');
    const template = this.templateStore.getTemplate(this.currentTemplateKey);
    const rowCount = this.dataSource.getRowCount();

    if (rowCount > 0) {
      hint?.classList.add('hidden');
      this.dataPreview.update();
    } else {
      hint?.classList.remove('hidden');
      this.dataPreview.updateFromRow(getSampleRowForTemplate(template));
    }

    requestAnimationFrame(() => {
      const { width, height } = this._getCurrentLayoutDimensions();
      this.dataPreview._fitPreviewMount(this.dataPreview.previewMount, width, height);
    });
  }

  _enterExportStep() {
    this.templateEditor.setHeaders(this.dataSource.getHeaders());
    this.exportGrid.resetRowSelection();
    this._syncBucketTabs();
    this._goToStep(3);
  }

  _selectInitialBucket(templateKey) {
    const template = this.templateStore.getTemplate(templateKey);
    const preferred = template.previewBucket;
    if (preferred && template.layouts[preferred]) {
      this.currentBucket = preferred;
      return;
    }
    const firstBucket = BUCKET_IDS.find((bucket) => template.layouts[bucket]);
    this.currentBucket = firstBucket || 'square';
  }

  _getBucketCss(bucket) {
    if (bucket === this.currentBucket) {
      return this.templateEditor.getCSS();
    }
    const template = this.templateStore.getTemplate(this.currentTemplateKey);
    return template.layouts[bucket]?.css ?? '';
  }

  _updateExportCount() {
    if (!this.exportBtn) return;

    const selectedCount = this.exportGrid.getSelectedCount();
    const buckets = this._getSelectedBuckets();

    if (buckets.length === 0 || selectedCount === 0) {
      this.exportBtn.textContent = 'Export Selected (0)';
      this.exportBtn.disabled = buckets.length === 0 || selectedCount === 0;
      return;
    }

    this.exportBtn.textContent = `Export Selected (${selectedCount})`;
    this.exportBtn.disabled = false;

    this._syncExportFormatTag();
  }

  _syncExportFormatTag() {
    const tag = document.getElementById('export-format-tag');
    if (!tag) return;

    const bucketLabel = FORMAT_BUCKETS[this.currentBucket]?.label ?? this.currentBucket;
    const ratioLabels = { square: '1:1', portrait: '4:5', story: '9:16', landscape: '1.91:1' };
    const ratio = ratioLabels[this.currentBucket] ?? '';
    tag.textContent = ratio ? `${bucketLabel} · ${ratio}` : bucketLabel;
  }

  _getCurrentLayoutDimensions() {
    const template = this.templateStore.getTemplate(this.currentTemplateKey);
    const layout = template.layouts[this.currentBucket];
    if (layout) return { width: layout.width, height: layout.height };
    return getDefaultDimensionsForBucket(this.currentBucket);
  }

  _saveCurrentEditorToTemplate() {
    const template = this.templateStore.getTemplate(this.currentTemplateKey);
    template.content = template.content || { html: '' };
    template.content.html = this.templateEditor.getHTML();
    const layout = template.layouts[this.currentBucket];
    if (layout) {
      layout.css = this.templateEditor.getCSS();
      this.templateStore.saveTemplate(this.currentTemplateKey, { ...template, id: this.currentTemplateKey });
    }
  }

  _onBucketTabClick(bucket) {
    if (!bucket) return;
    const template = this.templateStore.getTemplate(this.currentTemplateKey);

    if (!template.layouts[bucket]) {
      const bucketLabel = FORMAT_BUCKETS[bucket]?.label ?? bucket;
      const create = window.confirm(
        `This template has no ${bucketLabel} layout yet. Create one by copying CSS from an existing layout?`
      );
      if (!create) return;

      const sourceBucket = BUCKET_IDS.find((id) => template.layouts[id]);
      if (!sourceBucket) return;

      const dims = getDefaultDimensionsForBucket(bucket);
      template.layouts[bucket] = {
        css: template.layouts[sourceBucket].css,
        width: dims.width,
        height: dims.height,
      };
      this.templateStore.saveTemplate(this.currentTemplateKey, { ...template, id: this.currentTemplateKey });
    }

    this._saveCurrentEditorToTemplate();
    this.currentBucket = bucket;
    this.templateEditor.selectTemplate(this.currentTemplateKey);
    this._syncBucketTabs();
    this.exportGrid.render();
  }

  _syncBucketTabs() {
    const template = this.templateStore.getTemplate(this.currentTemplateKey);
    this.bucketTabBtns?.forEach((btn) => {
      const bucket = btn.dataset.bucket;
      const hasLayout = template.layouts[bucket] != null;
      btn.classList.toggle('active', bucket === this.currentBucket);
      btn.classList.toggle('bucket-missing', !hasLayout);
    });
  }

  _isBucketAvailable(template, bucket) {
    const layout = template.layouts[bucket];
    if (!layout) return false;
    return getPlatformLabelsForBucket(bucket, 'image').length > 0;
  }

  _getSelectedBuckets() {
    const template = this.templateStore.getTemplate(this.currentTemplateKey);
    if (this._isBucketAvailable(template, this.currentBucket)) {
      return [this.currentBucket];
    }
    return [];
  }

  _getExportTemplate() {
    this._saveCurrentEditorToTemplate();
    const template = this.templateStore.getTemplate(this.currentTemplateKey);
    template.content.html = this.templateEditor.getHTML();
    return template;
  }

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

  async _handleExport() {
    const hasSubscription = await this.subscriptionUI.requireSubscription();
    if (!hasSubscription) return;

    const selectedBuckets = this._getSelectedBuckets();
    if (selectedBuckets.length === 0) {

      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: 'Selected format is not available for this template', type: 'error' } })
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

    const template = this._getExportTemplate();
    const getBucketCss = (bucket) => this._getBucketCss(bucket);

    document.body.classList.add('social-exporting');
    this.progressSection?.classList.remove('hidden');
    this.progressFill.style.width = '0%';
    this.progressText.textContent = 'Preparing export…';
    this.exportBtn.disabled = true;

    try {
      if (this.dataSource.mode === 'single') {
        const { rowData } = selectedRows[0];
        await exportSinglePostPresets(template, rowData, selectedBuckets, (c, t, m) =>
          this._setExportProgress(c, t, m), getBucketCss
        );
      } else {
        await exportBulkPosts(template, selectedRows, selectedBuckets, (c, t, m) =>
          this._setExportProgress(c, t, m), getBucketCss
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
      this._updateExportCount();
      setTimeout(() => {
        document.body.classList.remove('social-exporting');
        this.progressSection?.classList.add('hidden');
      }, 1200);
    }
  }

  _bindToast() {
    const toastContainer = document.getElementById('toast-container');
    window.addEventListener('toast', (e) => {
      const { message, type } = e.detail;
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
      toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
      toastContainer.appendChild(toast);
      setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await authService.ready();
  await handleCheckoutReturn();
  new App();
});
