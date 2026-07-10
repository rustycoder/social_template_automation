/**
 * Unified HTML Template Loader
 *
 * Loads standalone HTML template files via glob, merges registry metadata,
 * and produces template objects for the preview/export pipeline.
 */

import { LEGACY_TEMPLATE_REGISTRY } from './legacyTemplateRegistry.js';
import { NICHE_TEMPLATE_REGISTRY } from './nicheTemplateRegistry.js';
import { AUDIENCE_TEMPLATE_REGISTRY } from './audienceTemplateRegistry.js';

const htmlModules = import.meta.glob('./*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const TEMPLATE_REGISTRY = [...LEGACY_TEMPLATE_REGISTRY, ...NICHE_TEMPLATE_REGISTRY, ...AUDIENCE_TEMPLATE_REGISTRY];

const LAYOUTS = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 628 },
};

function extractFontImports(rawHtml) {
  const imports = [];
  const linkRe = /<link[^>]+href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"[^>]*>/g;
  let m;
  while ((m = linkRe.exec(rawHtml)) !== null) {
    imports.push(`@import url('${m[1]}');`);
  }
  return imports;
}

function extractCss(rawHtml) {
  const parts = [];
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleRe.exec(rawHtml)) !== null) {
    parts.push(m[1].trim());
  }
  return parts.join('\n');
}

function extractBody(rawHtml) {
  const bodyRe = /<body[^>]*>([\s\S]*?)<\/body>/i;
  const m = bodyRe.exec(rawHtml);
  return m ? m[1].trim() : '';
}

function adaptCssToLayout(baseCss, fontImports, width, height) {
  let css = baseCss
    .replace(/(html,\s*body\s*\{[^}]*width:)\s*\d+px/g, `$1${width}px`)
    .replace(/(html,\s*body\s*\{[^}]*height:)\s*\d+px/g, `$1${height}px`)
    .replace(/(\.card\s*\{[^}]*width:)\s*\d+px/g, `$1${width}px`)
    .replace(/(\.card\s*\{[^}]*height:)\s*\d+px/g, `$1${height}px`);

  if (fontImports.length) {
    css = `${fontImports.join('\n')}\n${css}`;
  }
  return css;
}

function parseHtmlTemplate(rawHtml, { id, name, category, previewBucket, fields }) {
  const fontImports = extractFontImports(rawHtml);
  const baseCss = extractCss(rawHtml);
  const bodyHtml = extractBody(rawHtml);

  const layouts = {};
  for (const [bucket, { width, height }] of Object.entries(LAYOUTS)) {
    layouts[bucket] = {
      css: adaptCssToLayout(baseCss, fontImports, width, height),
      width,
      height,
    };
  }

  return {
    id,
    name,
    category: category || 'general',
    previewBucket: previewBucket || 'square',
    fields,
    content: { html: bodyHtml },
    layouts,
    isAnimated: false,
    _htmlSource: true,
  };
}

function loadTemplateRegistry() {
  const templates = {};

  for (const def of TEMPLATE_REGISTRY) {
    const moduleKey = `./${def.file}`;
    const rawHtml = htmlModules[moduleKey];
    if (!rawHtml) {
      console.warn(`[htmlTemplateLoader] Missing template file: ${def.file}`);
      continue;
    }
    templates[def.id] = parseHtmlTemplate(rawHtml, def);
  }

  return templates;
}

export const DEFAULT_TEMPLATE_ID = 'viral-shock-card';
export const HTML_TEMPLATES = loadTemplateRegistry();
export { TEMPLATE_REGISTRY };
