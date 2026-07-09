/**
 * Unified Template Store — HTML file templates with fields, layouts, and localStorage.
 */

import {
  HTML_TEMPLATES,
  DEFAULT_TEMPLATE_ID,
} from '../templates/htmlTemplateLoader.js';

const STORAGE_KEY = 'social-media-template-automation-templates';
const TEMPLATE_VERSION_KEY = 'social-media-template-automation-version';
const TEMPLATE_VERSION = 16;

const DEFAULT_TEMPLATES = HTML_TEMPLATES;

function cloneTemplate(template) {
  return structuredClone(template);
}

export class TemplateStore {
  constructor() {
    this._loadSaved();
  }

  _loadSaved() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.saved = saved ? JSON.parse(saved) : {};
    } catch {
      this.saved = {};
    }

    const version = parseInt(localStorage.getItem(TEMPLATE_VERSION_KEY), 10) || 0;
    if (version < TEMPLATE_VERSION) {
      for (const key of Object.keys(DEFAULT_TEMPLATES)) {
        delete this.saved[key];
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saved));
        localStorage.setItem(TEMPLATE_VERSION_KEY, String(TEMPLATE_VERSION));
      } catch {
        /* ignore quota errors */
      }
    }
  }

  getTemplate(id) {
    if (DEFAULT_TEMPLATES[id] && !this.saved[id]?.custom) {
      return cloneTemplate(DEFAULT_TEMPLATES[id]);
    }
    if (this.saved[id]) {
      return cloneTemplate(this.saved[id]);
    }
    if (DEFAULT_TEMPLATES[id]) {
      return cloneTemplate(DEFAULT_TEMPLATES[id]);
    }
    return cloneTemplate(DEFAULT_TEMPLATES[DEFAULT_TEMPLATE_ID]);
  }

  saveTemplate(id, templateData) {
    this.saved[id] = {
      ...templateData,
      id,
      custom: true,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saved));
    } catch (e) {
      console.error('Failed to save template:', e);
    }
  }

  getTemplateLabel(id) {
    if (this.saved[id]?.custom && this.saved[id].name) {
      return this.saved[id].name;
    }
    if (DEFAULT_TEMPLATES[id]?.name) {
      return DEFAULT_TEMPLATES[id].name;
    }
    return `Custom: ${id}`;
  }

  getDefaultTemplateId() {
    return DEFAULT_TEMPLATE_ID;
  }

  getDefaultTemplateKeys() {
    return Object.keys(DEFAULT_TEMPLATES);
  }

  getAllTemplateKeys() {
    return [...new Set([...Object.keys(DEFAULT_TEMPLATES), ...Object.keys(this.saved)])];
  }

  getVisibleTemplateKeys() {
    const customKeys = Object.keys(this.saved).filter((id) => this.saved[id]?.custom);
    return [...new Set([...Object.keys(DEFAULT_TEMPLATES), ...customKeys])];
  }
}
