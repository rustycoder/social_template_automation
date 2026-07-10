/**
 * @file features/domain/templateStore.js
 * @description Read-only template catalog — loads HTML templates with fields and per-bucket layouts.
 * @dependencies templates/htmlTemplateLoader.js
 * @state None — clones templates on read to prevent mutation.
 */

/**
 * Read-only template store — HTML file templates with fields and layouts.
 */

import {
  HTML_TEMPLATES,
  DEFAULT_TEMPLATE_ID,
} from '../../templates/htmlTemplateLoader.js';
import { CATEGORY_OPTIONS } from '../../templates/templateCategories.js';

function cloneTemplate(template) {
  return structuredClone(template);
}

export class TemplateStore {
  getTemplate(id) {
    if (HTML_TEMPLATES[id]) {
      return cloneTemplate(HTML_TEMPLATES[id]);
    }
    return cloneTemplate(HTML_TEMPLATES[DEFAULT_TEMPLATE_ID]);
  }

  getDefaultTemplateId() {
    return DEFAULT_TEMPLATE_ID;
  }

  getVisibleTemplateKeys() {
    return Object.keys(HTML_TEMPLATES);
  }

  getTotalTemplateCount() {
    return this.getVisibleTemplateKeys().length;
  }

  /** @returns {Record<string, number>} */
  getCategoryCounts() {
    const counts = {};
    for (const key of this.getVisibleTemplateKeys()) {
      const category = this.getTemplate(key).category || 'general';
      counts[category] = (counts[category] ?? 0) + 1;
    }
    return counts;
  }

  getCategoryOptions() {
    return CATEGORY_OPTIONS;
  }
}
