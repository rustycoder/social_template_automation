/**
 * Social Media Template Automation — unified social post generator
 */
import './style.css';
import { TemplateStore } from './modules/templateStore.js';
import { TemplateEditor } from './modules/templateEditor.js';
import { DataSource } from './modules/dataSource.js';
import { UploadStep } from './modules/uploadStep.js';
import { PostPreview, getDefaultDimensionsForBucket } from './modules/preview.js';
import { getTemplateFields } from './modules/templateFields.js';
import { renderGalleryPreview } from './modules/templateGalleryPreview.js';
import { getSampleRowForTemplate } from './modules/templateSampleData.js';
import { FORMAT_BUCKETS, PLATFORM_PRESETS, getPresetsSupportingMedia } from './modules/social/socialFormats.js';
import {
  exportBulkPosts,
  exportSinglePostPresets,
  exportBulkVideos,
  estimateBulkVideoJob,
  exportSingleVideo,
} from './modules/exporter.js';
import { ANIMATION_PRESETS, syncTemplateAnimatedFlag } from './modules/social/socialAnimations.js';
import { ExportGrid } from './modules/social/exportGrid.js';
import { authService } from './modules/auth.js';
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
    this.exportMediaType = 'image';
    this._progressRaf = null;

    this.editorStore = this._createEditorStoreAdapter();
    this.templateEditor = new TemplateEditor(this.editorStore, {
      htmlContainerId: 'html-editor-container',
      cssContainerId: 'css-editor-container',
      tagsListId: 'tags-list',
      templateSelectId: 'template-select-hidden',
      saveTemplateBtnId: 'btn-save-template',
      tabBtnsSelector: '#customize-panel .editor-tabs .tab-btn',
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
      getMediaType: () => this.exportMediaType,
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
    this._bindAnimationUI();
    this._bindBucketTabs();
    this._bindToast();
    this._renderTemplateGallery();
    this._selectInitialBucket(this.currentTemplateKey);
    this.templateEditor.selectTemplate(this.currentTemplateKey);
    this._selectTemplate(this.currentTemplateKey);
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
    document.querySelectorAll('.step-btn').forEach((btn) => {
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

    const keys = this.templateStore.getVisibleTemplateKeys();
    this.templateGrid.innerHTML = '';

    for (const key of keys) {
      const template = this.templateStore.getTemplate(key);
      const card = document.createElement('div');
      card.className = 'template-card';
      card.dataset.template = key;
      if (key === this.currentTemplateKey) {
        card.classList.add('selected');
      }

      const fields = getTemplateFields(template);
      const fieldSummary = fields.map((f) => f.key).join(', ');

      card.innerHTML = `
        <div class="template-preview-container">
          <div class="template-preview-mount" data-template-id="${key}"></div>
        </div>
        <div class="template-card-body">
          <h4>${template.name}</h4>
          <p class="template-card-fields">${fieldSummary}</p>
        </div>
      `;

      card.addEventListener('click', () => {
        this._selectTemplate(key);
        this._goToDataStep();
      });
      this.templateGrid.appendChild(card);

      const previewMount = card.querySelector('.template-preview-mount');
      renderGalleryPreview(template, previewMount);
    }
  }

  /**
   * @param {string} key
   */
  _selectTemplate(key) {
    this.currentTemplateKey = key;
    this.templateEditor.currentTemplateKey = key;
    this._selectInitialBucket(key);
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

  _bindAnimationUI() {
    this.animationPanel = document.getElementById('animation-panel');
    this.animateToggle = document.getElementById('animate-toggle');
    this.animationPresetGroup = document.getElementById('animation-preset-group');
    this.animationPresetSelect = document.getElementById('animation-preset');

    this.animateToggle?.addEventListener('change', () => this._onAnimationToggleChange());
    this.animationPresetSelect?.addEventListener('change', () => {
      if (this.animateToggle?.checked) this._saveAnimationToTemplate();
    });
  }

  _bindExportUI() {
    this.progressSection = document.getElementById('progress-section');
    this.progressFill = document.getElementById('progress-fill');
    this.progressText = document.getElementById('progress-text');
    this.exportBtn = document.getElementById('btn-export');
    this.exportMediaToggle = document.getElementById('export-media-toggle');
    this.exportMediaBtns = document.querySelectorAll('#export-media-toggle [data-export-media]');

    this.exportMediaBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const media = btn.dataset.exportMedia;
        if (!media || media === this.exportMediaType) return;
        this.exportMediaType = media;
        this._syncExportMediaButtons();
        this.exportGrid.render();
      });
    });

    this.exportBtn?.addEventListener('click', () => this._handleExport());
  }

  _getMaxAccessibleStep() {
    if (!this.currentTemplateKey) return 1;
    if (this.dataSource.getRowCount() === 0) return 2;
    return 3;
  }

  _goToStep(step) {
    this.currentStep = step;

    document.querySelectorAll('.step-panel').forEach((panel) => panel.classList.remove('active'));
    document.getElementById(`step-${step}`)?.classList.add('active');

    document.querySelectorAll('.step-btn').forEach((btn) => {
      const btnStep = parseInt(btn.dataset.step, 10);
      btn.classList.remove('active', 'completed');
      if (btnStep === step) btn.classList.add('active');
      else if (btnStep < step) btn.classList.add('completed');
    });

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
      this._syncBucketTabs();
      this._syncAnimationPanel();
      this._syncExportMediaType();
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
    this._syncBucketTabs();
    this._syncAnimationPanel();
    this._syncExportMediaType();
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
    const count = this.exportGrid.getSelectedCount();
    const label = count === 1 ? 'Download 1 format' : `Download ${count} formats`;
    this.exportBtn.textContent = label;
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
    this._syncAnimationPanel();
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

  _bucketSupportsVideo(bucket) {
    return getPresetsSupportingMedia('video').some((preset) => preset.bucket === bucket);
  }

  _canExportVideo(template) {
    return PLATFORM_PRESETS.some(
      (preset) =>
        preset.media.includes('video') &&
        template.layouts[preset.bucket] != null &&
        template.layouts[preset.bucket].animation
    );
  }

  _getDefaultAnimationPresetKey() {
    return this.currentTemplateKey === 'news-reel' ? 'news-reel-stagger' : 'fade-slide-headline';
  }

  _syncAnimationPanel() {
    if (!this.animationPanel) return;
    const supportsVideo = this._bucketSupportsVideo(this.currentBucket);
    this.animationPanel.classList.toggle('hidden', !supportsVideo);
    if (!supportsVideo) return;

    const template = this.templateStore.getTemplate(this.currentTemplateKey);
    const layout = template.layouts[this.currentBucket];
    const hasAnimation = !!layout?.animation;

    if (this.animateToggle) this.animateToggle.checked = hasAnimation;
    this.animationPresetGroup?.classList.toggle('hidden', !hasAnimation);
    if (this.animationPresetSelect) {
      this.animationPresetSelect.value = this._getDefaultAnimationPresetKey();
    }
  }

  _saveAnimationToTemplate() {
    const template = this.templateStore.getTemplate(this.currentTemplateKey);
    const layout = template.layouts[this.currentBucket];
    if (!layout) return;

    const presetKey = this.animationPresetSelect?.value || this._getDefaultAnimationPresetKey();
    const preset = ANIMATION_PRESETS[presetKey];
    if (!preset) return;

    layout.animation = structuredClone(preset);
    syncTemplateAnimatedFlag(template);
    this.templateStore.saveTemplate(this.currentTemplateKey, { ...template, id: this.currentTemplateKey });
  }

  _onAnimationToggleChange() {
    const template = this.templateStore.getTemplate(this.currentTemplateKey);
    const layout = template.layouts[this.currentBucket];
    if (!layout) return;

    const enabled = !!this.animateToggle?.checked;
    this.animationPresetGroup?.classList.toggle('hidden', !enabled);

    if (enabled) {
      const presetKey = this._getDefaultAnimationPresetKey();
      if (this.animationPresetSelect) this.animationPresetSelect.value = presetKey;
      layout.animation = structuredClone(ANIMATION_PRESETS[presetKey]);
    } else {
      delete layout.animation;
    }

    syncTemplateAnimatedFlag(template);
    this.templateStore.saveTemplate(this.currentTemplateKey, { ...template, id: this.currentTemplateKey });
    this._syncExportMediaType();
    this.exportGrid.render();
  }

  _getExportTemplate() {
    this._saveCurrentEditorToTemplate();
    const template = this.templateStore.getTemplate(this.currentTemplateKey);
    template.content.html = this.templateEditor.getHTML();
    return template;
  }

  _getAvailablePresets(template, mediaType = 'image') {
    return PLATFORM_PRESETS.filter((preset) => {
      const layout = template.layouts[preset.bucket];
      if (!layout) return false;
      if (!preset.media.includes(mediaType)) return false;
      if (mediaType === 'video') return !!layout.animation;
      return true;
    });
  }

  _syncExportMediaType() {
    const template = this._getExportTemplate();
    const canVideo = this._canExportVideo(template);

    this.exportMediaToggle?.classList.toggle('hidden', !canVideo);
    if (!canVideo && this.exportMediaType === 'video') {
      this.exportMediaType = 'image';
    }
    this._syncExportMediaButtons();
  }

  _syncExportMediaButtons() {
    this.exportMediaBtns?.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.exportMedia === this.exportMediaType);
    });
  }

  _getSelectedPresets() {
    const template = this.templateStore.getTemplate(this.currentTemplateKey);
    const availableIds = new Set(
      this._getAvailablePresets(template, this.exportMediaType).map((preset) => preset.id)
    );

    return this.exportGrid
      .getSelectedPresetIds()
      .map((id) => PLATFORM_PRESETS.find((preset) => preset.id === id))
      .filter((preset) => preset && availableIds.has(preset.id));
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

    const selectedPresets = this._getSelectedPresets();
    if (selectedPresets.length === 0) {
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: 'Select at least one export format', type: 'error' } })
      );
      return;
    }

    const rows = this.dataSource.getRows();
    if (rows.length === 0) {
      window.dispatchEvent(
        new CustomEvent('toast', { detail: { message: 'No post data loaded', type: 'error' } })
      );
      return;
    }

    const template = this._getExportTemplate();

    if (this.exportMediaType === 'video' && this.dataSource.mode === 'bulk') {
      const { videoCount, estimatedMinutes } = estimateBulkVideoJob(template, rows, selectedPresets);
      const confirmed = window.confirm(
        `This will render approximately ${videoCount} video(s), estimated ${estimatedMinutes} minute(s). Continue?`
      );
      if (!confirmed) return;
    }

    document.body.classList.add('social-exporting');
    this.progressSection?.classList.remove('hidden');
    this.progressFill.style.width = '0%';
      this.progressText.textContent = 'Preparing export…';
    this.exportBtn.disabled = true;

    try {
      if (this.exportMediaType === 'video' && this.dataSource.mode === 'single') {
        await exportSingleVideo(template, rows[0], selectedPresets[0], (c, t, m) =>
          this._setExportProgress(c, t, m)
        );
      } else if (this.exportMediaType === 'video') {
        await exportBulkVideos(template, rows, selectedPresets, (c, t, m) =>
          this._setExportProgress(c, t, m)
        );
      } else if (this.dataSource.mode === 'single') {
        await exportSinglePostPresets(template, rows[0], selectedPresets, (c, t, m) =>
          this._setExportProgress(c, t, m)
        );
      } else {
        await exportBulkPosts(template, rows, selectedPresets, (c, t, m) =>
          this._setExportProgress(c, t, m)
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
  new App();
});
