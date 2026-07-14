/**
 * @file features/domain/templateStore.js
 * @description Template catalog loaded from the API (database-backed HTML templates).
 * @dependencies templates/htmlTemplateLoader.js, features/auth/api.js
 * @state Loaded template map and category options.
 */

import {
  buildTemplateCatalog,
  DEFAULT_TEMPLATE_ID,
} from '../../templates/htmlTemplateLoader.js';
import { CATEGORY_OPTIONS as FALLBACK_CATEGORIES } from '../../templates/templateCategories.js';
import { api } from '../auth/api.js';

function cloneTemplate(template) {
  return structuredClone(template);
}

export class TemplateStore {
  constructor() {
    /** @type {Record<string, object>} */
    this._templates = {};
    /** @type {{ id: string, label: string }[]} */
    this._categoryOptions = [...FALLBACK_CATEGORIES];
    this._loaded = false;
    this._error = null;
  }

  /**
   * Fetch templates and categories from the API.
   * @returns {Promise<void>}
   */
  async load() {
    try {
      const [{ templates }, { categories }] = await Promise.all([
        api.getTemplates(),
        api.getCategories(),
      ]);

      this._templates = buildTemplateCatalog(templates);
      this._categoryOptions = (categories || []).map((c) => ({
        id: c.id,
        label: c.label,
      }));

      if (this._categoryOptions.length === 0) {
        this._categoryOptions = [...FALLBACK_CATEGORIES];
      }

      this._loaded = true;
      this._error = null;
    } catch (error) {
      this._error = error;
      this._loaded = false;
      console.error('Failed to load templates from API:', error);
      throw error;
    }
  }

  isLoaded() {
    return this._loaded;
  }

  getLoadError() {
    return this._error;
  }

  getTemplate(id) {
    if (this._templates[id]) {
      return cloneTemplate(this._templates[id]);
    }
    const fallbackId = this.getDefaultTemplateId();
    if (this._templates[fallbackId]) {
      return cloneTemplate(this._templates[fallbackId]);
    }
    const firstKey = Object.keys(this._templates)[0];
    if (firstKey) {
      return cloneTemplate(this._templates[firstKey]);
    }
    return {
      id: 'empty',
      name: 'No templates',
      category: 'general',
      previewBucket: 'square',
      fields: [],
      content: { html: '' },
      layouts: {
        square: { css: '', width: 1080, height: 1080 },
        portrait: { css: '', width: 1080, height: 1350 },
        story: { css: '', width: 1080, height: 1920 },
        landscape: { css: '', width: 1200, height: 628 },
      },
      isAnimated: false,
      _htmlSource: true,
    };
  }

  getDefaultTemplateId() {
    if (this._templates[DEFAULT_TEMPLATE_ID]) {
      return DEFAULT_TEMPLATE_ID;
    }
    return Object.keys(this._templates)[0] || DEFAULT_TEMPLATE_ID;
  }

  getVisibleTemplateKeys() {
    return Object.keys(this._templates);
  }

  getTotalTemplateCount() {
    return this.getVisibleTemplateKeys().length;
  }

  /** @returns {Record<string, number>} */
  getCategoryCounts() {
    const counts = {};
    for (const key of this.getVisibleTemplateKeys()) {
      const category = this._templates[key]?.category || 'general';
      counts[category] = (counts[category] ?? 0) + 1;
    }
    return counts;
  }

  getCategoryOptions() {
    return this._categoryOptions;
  }
}
