/**
 * @file features/App.js
 * @description Top-level application orchestrator — wires shell modules, page controllers,
 *              domain services, rendering pipeline, and auth/billing subsystems.
 * @dependencies features/domain, features/rendering, features/auth, features/modules, features/pages
 * @state currentTemplateKey, currentBucket, page controller instances.
 */

import { TemplateStore } from './domain/templateStore.js';
import { DataSource } from './domain/dataSource.js';
import { PostPreview, getDefaultDimensionsForBucket } from './rendering/preview.js';
import { ExportGrid } from './rendering/exportGrid.js';
import { getPlatformLabelsForBucket } from './rendering/socialFormats.js';
import { authService } from './auth/auth.js';
import { handleCheckoutReturn } from './auth/checkout.js';
import { AuthUI } from './auth/authUI.js';
import { SubscriptionUI } from './auth/subscriptionUI.js';
import { BillingUI } from './auth/billingUI.js';
import { PostsUI } from './auth/postsUI.js';

import { LayoutModule } from './modules/LayoutModule.js';
import { DataEntryModule } from './modules/DataEntryModule.js';
import { SelectionModule } from './modules/SelectionModule.js';
import { TemplatePage } from './pages/TemplatePage.js';
import { DataPage } from './pages/DataPage.js';
import { ExportPage } from './pages/ExportPage.js';

export class App {
  /**
   * @description Bootstraps all workflow modules and page controllers.
   * @param {{ templateStore: import('./domain/templateStore.js').TemplateStore }} deps
   */
  constructor(deps) {
    this.templateStore = deps.templateStore;
    this.dataSource = new DataSource();

    /** @type {string} */
    this.currentTemplateKey = this.templateStore.getDefaultTemplateId();

    /** @type {string} */
    this.currentBucket = 'square';

    const previewContent = this._createPreviewContentAccessors();

    this.preview = new PostPreview(this.dataSource, previewContent);
    this.dataPreview = new PostPreview(this.dataSource, previewContent, {
      mountId: 'data-preview-mount',
      frameWrapperId: 'data-preview-frame-wrapper',
      navId: 'data-preview-nav',
      prevRowBtnId: 'data-btn-prev-row',
      nextRowBtnId: 'data-btn-next-row',
      rowIndicatorId: 'data-preview-row-indicator',
      formatTagId: 'data-preview-format-tag',
      skipWrapperAspectRatio: true,
    });

    this.selection = new SelectionModule({
      onSelectionChange: () => this.exportPage?.updateExportButton(),
    });

    this.exportGrid = new ExportGrid(this.dataSource, this.preview, this.selection, {
      getTemplate: () => this._getExportTemplate(),
      getBucketCss: (bucket) => this._getBucketCss(bucket),
      getMediaType: () => 'image',
      getCurrentBucket: () => this.currentBucket,
    });

    this.dataEntry = new DataEntryModule(this.dataSource, () =>
      this.templateStore.getTemplate(this.currentTemplateKey)
    );
    this.dataEntry.onContinue = () => this._enterExportStep();
    this.dataEntry.onDataChange = () => this.dataPage.updatePreview();

    this.authUI = new AuthUI();
    this.subscriptionUI = new SubscriptionUI(this.authUI);
    this.billingUI = new BillingUI(this.authUI);
    this.postsUI = new PostsUI(this.authUI);
    this.authUI.onBillingClick = () => this.billingUI.show();
    this.authUI.onPostsClick = () => this.postsUI.show();
    this.authUI.onAdminClick = () => {
      window.location.assign('/admin.html');
    };
    this.authUI.onLogout = () => {
      this.billingUI?.hide();
      this.postsUI?.hide();
      this.layout.goToStep(1);
    };

    this.layout = new LayoutModule({
      initialStep: 1,
      getMaxAccessibleStep: () => this._getMaxAccessibleStep(),
      onStepChange: (step) => this._onStepChange(step),
    });

    this.templatePage = new TemplatePage(this.templateStore, {
      onTemplateSelect: (key) => this._onTemplateSelected(key),
      onBucketChange: (bucket) => {
        this.currentBucket = bucket;
      },
    });

    this.dataPage = new DataPage(
      this.dataPreview,
      () => this.templateStore.getTemplate(this.currentTemplateKey),
      this.dataSource,
      () => this._getCurrentLayoutDimensions()
    );

    this.exportPage = new ExportPage(this.selection, this.exportGrid, this.dataSource, {
      getTemplate: () => this._getExportTemplate(),
      getCurrentBucket: () => this.currentBucket,
      getBucketCss: (bucket) => this._getBucketCss(bucket),
      getSelectedBuckets: () => this._getSelectedBuckets(),
      requireSubscription: () => this.subscriptionUI.requireSubscription(),
      getTemplateId: () => this.currentTemplateKey,
    });

    this.currentTemplateKey = this.templatePage.getCurrentTemplateKey();
    this.currentBucket = this.templatePage.selectInitialBucket(this.currentTemplateKey);
    this.templatePage.selectTemplate(this.currentTemplateKey);

    this._bindToast();
  }

  /**
   * @description Builds preview content accessor object shared by preview instances.
   * @returns {object} getHtml, getCss, getBucket, getLayoutDimensions accessors.
   * @private
   */
  _createPreviewContentAccessors() {
    return {
      getHtml: () => {
        const template = this.templateStore.getTemplate(this.currentTemplateKey);
        return template.content?.html ?? '';
      },
      getCss: (bucket) => {
        const layoutBucket = bucket ?? this.currentBucket;
        const template = this.templateStore.getTemplate(this.currentTemplateKey);
        return template.layouts[layoutBucket]?.css ?? '';
      },
      getBucket: () => this.currentBucket,
      getLayoutDimensions: () => this._getCurrentLayoutDimensions(),
    };
  }

  /**
   * @description Highest step the user may navigate to based on template + data state.
   * @returns {number}
   * @private
   */
  _getMaxAccessibleStep() {
    if (!this.currentTemplateKey) return 1;
    if (this.dataSource.getRowCount() === 0) return 2;
    return 3;
  }

  /**
   * @description Handles post-step-change side effects per workflow page.
   * @param {number} step Active step (1, 2, or 3).
   * @returns {void}
   * @private
   */
  _onStepChange(step) {
    if (step === 2) {
      this.dataPage.onEnter();
    } else if (step === 3) {
      this.exportPage.onEnter();
    }
  }

  /**
   * @description User selected a template card — sync bucket and navigate to Data Page.
   * @param {string} key Template identifier.
   * @returns {void}
   * @private
   */
  _onTemplateSelected(key) {
    this.currentTemplateKey = key;
    this.currentBucket = this.templatePage.getGalleryBucket();
    this.dataEntry.rebuildFormForTemplate();
    this.dataPage.prepareForEntry();
    this.layout.goToStep(2);
  }

  /**
   * @description Advances from Data Page to Export Page after validation passes.
   * @returns {void}
   * @private
   */
  _enterExportStep() {
    this.selection.reset();
    this.layout.goToStep(3);
  }

  /**
   * @description Resolves layout pixel dimensions for the active template + bucket.
   * @returns {{ width: number, height: number }}
   * @private
   */
  _getCurrentLayoutDimensions() {
    const template = this.templateStore.getTemplate(this.currentTemplateKey);
    const layout = template.layouts[this.currentBucket];
    if (layout) return { width: layout.width, height: layout.height };
    return getDefaultDimensionsForBucket(this.currentBucket);
  }

  /**
   * @description Returns CSS for a format bucket on the active template.
   * @param {string} bucket Format bucket id.
   * @returns {string}
   * @private
   */
  _getBucketCss(bucket) {
    const template = this.templateStore.getTemplate(this.currentTemplateKey);
    return template.layouts[bucket]?.css ?? '';
  }

  /**
   * @description Checks bucket availability for the active template.
   * @param {object} template Template definition.
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
   * @description Returns exportable buckets for the current template selection.
   * @returns {string[]}
   * @private
   */
  _getSelectedBuckets() {
    const template = this.templateStore.getTemplate(this.currentTemplateKey);
    if (this._isBucketAvailable(template, this.currentBucket)) {
      return [this.currentBucket];
    }
    return [];
  }

  /**
   * @description Returns the active template for export operations.
   * @returns {object}
   * @private
   */
  _getExportTemplate() {
    return this.templateStore.getTemplate(this.currentTemplateKey);
  }

  /**
   * @description Global toast listener for success/error/info messages.
   * @returns {void}
   * @private
   */
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

/**
 * @description Application entry bootstrap — awaits auth/checkout/templates then mounts App.
 * @returns {Promise<void>}
 */
export async function bootstrapApp() {
  await authService.ready();
  await handleCheckoutReturn();

  const templateStore = new TemplateStore();
  try {
    await templateStore.load();
  } catch (error) {
    console.error(error);
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
      const toast = document.createElement('div');
      toast.className = 'toast error';
      toast.innerHTML = `<span class="toast-icon">✕</span><span>Failed to load templates from server. Is the API running?</span>`;
      toastContainer.appendChild(toast);
    }
  }

  new App({ templateStore });
}
