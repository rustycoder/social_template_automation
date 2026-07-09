/**
 * Unified Template Store — social post templates with fields, layouts, and localStorage.
 *
 * Template shape:
 * {
 *   id, name,
 *   fields: [{ key, label, type: 'text'|'textarea'|'image', required? }],
 *   content: { html },
 *   layouts: {
 *     square|portrait|story|landscape: { css, width, height, animation? } | null
 *   },
 *   isAnimated: boolean
 * }
 */

import { squareBasicTemplate } from '../templates/social/squareBasic.js';
import { storyBasicTemplate } from '../templates/social/storyBasic.js';
import { gradientBasicTemplate } from '../templates/social/gradientBasic.js';
import { newsReelTemplate } from '../templates/social/newsReel.js';
import { heistPostTemplate } from '../templates/social/heistPost.js';
import { sportsNewsCardTemplate } from '../templates/social/sportsNewsCard.js';
import { viralHighlightCardTemplate } from '../templates/social/viralHighlightCard.js';
import { breakingNewsCardTemplate } from '../templates/social/breakingNewsCard.js';
import { wireBreakingCardTemplate } from '../templates/social/wireBreakingCard.js';
import { editorialFeatureCardTemplate } from '../templates/social/editorialFeatureCard.js';
import { dataAnalysisCardTemplate } from '../templates/social/dataAnalysisCard.js';
import {
  viralShockCardTemplate,
  highlightWireCardTemplate,
  bannerBoldCardTemplate,
  stampBreakingCardTemplate,
} from '../templates/social/htmlTemplateLoader.js';

const STORAGE_KEY = 'social-media-template-automation-templates';
const TEMPLATE_VERSION_KEY = 'social-media-template-automation-version';
const TEMPLATE_VERSION = 15;

const DEFAULT_TEMPLATE_ID = 'gradient-basic';

const HIDDEN_BUILTIN_KEYS = new Set(['square-basic', 'story-basic']);

const DEFAULT_TEMPLATES = {
  'gradient-basic': gradientBasicTemplate,
  'square-basic': squareBasicTemplate,
  'story-basic': storyBasicTemplate,
  'news-reel': newsReelTemplate,
  'ai-heist': heistPostTemplate,
  'sports-news-card': sportsNewsCardTemplate,
  'viral-highlight-card': viralHighlightCardTemplate,
  'breaking-news-card': breakingNewsCardTemplate,
  'wire-breaking-card': wireBreakingCardTemplate,
  'editorial-feature-card': editorialFeatureCardTemplate,
  'data-analysis-card': dataAnalysisCardTemplate,
  'viral-shock-card': viralShockCardTemplate,
  'highlight-wire-card': highlightWireCardTemplate,
  'banner-bold-card': bannerBoldCardTemplate,
  'stamp-breaking-card': stampBreakingCardTemplate,
};

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
    const visibleBuiltins = Object.keys(DEFAULT_TEMPLATES).filter((id) => !HIDDEN_BUILTIN_KEYS.has(id));
    const customKeys = Object.keys(this.saved).filter((id) => this.saved[id]?.custom);
    return [...new Set([...visibleBuiltins, ...customKeys])];
  }
}
