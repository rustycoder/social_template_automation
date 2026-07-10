/**
 * @file features/pages/TemplatePage.js
 * @description Page 1 — template discovery grid with search, aspect-ratio filtering, and gallery previews.
 * @dependencies features/components/PostCard.js, features/shared/constants.js, features/rendering/templateGalleryPreview.js
 * @state galleryBucket, templateSearchQuery, templateGalleryLimit, currentTemplateKey (owned by page controller).
 */

import { createTemplateCard } from '../components/PostCard.js';
import {
  BUCKET_RATIO_LABELS,
  DEFAULT_GALLERY_LIMIT,
  GALLERY_LIMIT_STEP,
} from '../shared/constants.js';
import { renderGalleryPreview } from '../rendering/templateGalleryPreview.js';
import { getCategoryLabel } from '../../templates/templateCategories.js';

export class TemplatePage {
  /**
   * @description Creates the Template Page controller.
   * @param {import('../domain/templateStore.js').TemplateStore} templateStore Template catalog.
   * @param {object} callbacks
   * @param {(templateKey: string) => void} callbacks.onTemplateSelect Fired when user picks a template.
   * @param {(bucket: string) => void} [callbacks.onBucketChange] Fired when gallery aspect bucket changes.
   */
  constructor(templateStore, callbacks) {
    this.templateStore = templateStore;
    this.onTemplateSelect = callbacks.onTemplateSelect;
    this.onBucketChange = callbacks.onBucketChange ?? (() => {});

    /** @type {string} */
    this.galleryBucket = 'square';

    /** @type {string} */
    this.currentTemplateKey = this.templateStore.getDefaultTemplateId();

    /** @type {string} */
    this.templateSearchQuery = '';

    /** @type {string} */
    this.templateCategoryFilter = '';

    /** @type {number} */
    this.templateGalleryLimit = DEFAULT_GALLERY_LIMIT;

    this.templateGrid = document.getElementById('template-grid');
    this.templateSearchInput = document.getElementById('template-search');
    this.templateCategorySelect = document.getElementById('template-category-filter');
    this.loadMoreBtn = document.getElementById('btn-load-more-templates');
    this.galleryFormatTabBtns = document.querySelectorAll('#template-format-tabs [data-gallery-bucket]');

    this._populateCategoryFilter();
    this._bindEvents();
    this.render();
    this.selectInitialBucket(this.currentTemplateKey);
  }

  /**
   * @description Fills the category dropdown from the template store.
   * @returns {void}
   * @private
   */
  _populateCategoryFilter() {
    if (!this.templateCategorySelect) return;

    const options = this.templateStore.getCategoryOptions();
    for (const { id, label } of options) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = label;
      this.templateCategorySelect.appendChild(option);
    }
  }

  /**
   * @description Binds search, load-more, and footer aspect-ratio tab interactions.
   * @returns {void}
   * @private
   */
  _bindEvents() {
    this.templateSearchInput?.addEventListener('input', () => {
      this.templateSearchQuery = this.templateSearchInput.value.trim().toLowerCase();
      this.templateGalleryLimit = DEFAULT_GALLERY_LIMIT;
      this.render();
    });

    this.templateCategorySelect?.addEventListener('change', () => {
      this.templateCategoryFilter = this.templateCategorySelect.value;
      this.templateGalleryLimit = DEFAULT_GALLERY_LIMIT;
      this.render();
    });

    this.loadMoreBtn?.addEventListener('click', () => {
      this.templateGalleryLimit += GALLERY_LIMIT_STEP;
      this.render();
    });

    this.galleryFormatTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const bucket = btn.dataset.galleryBucket;
        if (!bucket || bucket === this.galleryBucket) return;
        this.galleryBucket = bucket;
        this.templateGalleryLimit = DEFAULT_GALLERY_LIMIT;
        this.syncGalleryFormatTabs();
        this.render();
        this.onBucketChange(bucket);
      });
    });
  }

  /**
   * @description Highlights the active aspect-ratio tab in the sticky footer.
   * @returns {void}
   */
  syncGalleryFormatTabs() {
    this.galleryFormatTabBtns?.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.galleryBucket === this.galleryBucket);
    });
  }

  /**
   * @description Returns the currently highlighted template key.
   * @returns {string}
   */
  getCurrentTemplateKey() {
    return this.currentTemplateKey;
  }

  /**
   * @description Returns the active gallery aspect bucket.
   * @returns {string}
   */
  getGalleryBucket() {
    return this.galleryBucket;
  }

  /**
   * @description Sets the selected template key and updates card selected states.
   * @param {string} key Template identifier.
   * @returns {void}
   */
  selectTemplate(key) {
    this.currentTemplateKey = key;
    this.templateGrid?.querySelectorAll('.template-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.template === key);
      card.classList.toggle('post-card--selected', card.dataset.template === key);
    });
  }

  /**
   * @description Picks the best default bucket for a template based on previewBucket or first layout.
   * @param {string} templateKey Template identifier.
   * @returns {string} Resolved bucket id.
   */
  selectInitialBucket(templateKey) {
    const template = this.templateStore.getTemplate(templateKey);
    const preferred = template.previewBucket;
    if (preferred && template.layouts[preferred]) {
      this.galleryBucket = preferred;
      this.syncGalleryFormatTabs();
      return preferred;
    }
    const buckets = ['square', 'portrait', 'story', 'landscape'];
    const firstBucket = buckets.find((bucket) => template.layouts[bucket]);
    this.galleryBucket = firstBucket || 'square';
    this.syncGalleryFormatTabs();
    return this.galleryBucket;
  }

  /**
   * @description Re-renders the template masonry grid with search and pagination filters.
   * @returns {void}
   */
  render() {
    if (!this.templateGrid) return;

    const allKeys = this.templateStore.getVisibleTemplateKeys();
    const filteredKeys = allKeys.filter((key) => {
      const template = this.templateStore.getTemplate(key);

      if (this.templateCategoryFilter && template.category !== this.templateCategoryFilter) {
        return false;
      }

      if (!this.templateSearchQuery) return true;

      const categoryLabel = getCategoryLabel(template.category).toLowerCase();
      return (
        template.name.toLowerCase().includes(this.templateSearchQuery) ||
        categoryLabel.includes(this.templateSearchQuery)
      );
    });

    const visibleKeys = filteredKeys.slice(0, this.templateGalleryLimit);
    const hasMore = filteredKeys.length > visibleKeys.length;

    this.templateGrid.innerHTML = '';
    this.templateGrid.dataset.galleryBucket = this.galleryBucket;
    this.syncGalleryFormatTabs();

    if (filteredKeys.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'template-page__empty';
      empty.textContent = this.templateSearchQuery || this.templateCategoryFilter
        ? 'No templates match your filters.'
        : 'No templates available.';
      this.templateGrid.appendChild(empty);
      this.loadMoreBtn?.classList.add('hidden');
      return;
    }

    const aspectLabel = BUCKET_RATIO_LABELS[this.galleryBucket] ?? '';

    for (const key of visibleKeys) {
      const template = this.templateStore.getTemplate(key);
      const hasLayout = template.layouts?.[this.galleryBucket] != null;

      const card = createTemplateCard({
        templateKey: key,
        title: template.name,
        bucket: this.galleryBucket,
        categoryId: template.category,
        selected: key === this.currentTemplateKey && hasLayout,
        unavailable: !hasLayout,
        onSelect: (templateKey) => {
          this.selectTemplate(templateKey);
          this.onTemplateSelect(templateKey);
        },
      });

      this.templateGrid.appendChild(card);

      const previewMount = card.querySelector('.template-preview-mount');
      if (hasLayout) {
        renderGalleryPreview(template, previewMount, { bucket: this.galleryBucket });
      } else {
        previewMount.innerHTML =
          '<span class="gallery-preview-unavailable">Not available in this format</span>';
      }

      if (!hasLayout) {
        card.querySelector('.template-aspect-badge').textContent = aspectLabel;
      }
    }

    if (this.loadMoreBtn) {
      this.loadMoreBtn.classList.toggle('hidden', !hasMore);
    }
  }
}
