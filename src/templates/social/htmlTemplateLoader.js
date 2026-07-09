/**
 * Unified HTML Template Loader
 *
 * Loads standalone HTML template files, extracts their CSS/body/fonts,
 * and produces template objects that conform to the existing pipeline interface.
 *
 * Dimension adaptation follows the same regex strategy as render.js:
 * swap width/height on html,body and .card selectors per layout bucket.
 */

import viralHtml from '../html/template-c-viral.html?raw';
import highlightHtml from '../html/template-d-highlight.html?raw';
import bannerHtml from '../html/template-e-banner.html?raw';
import stampHtml from '../html/template-f-stamp.html?raw';

const LAYOUTS = {
  square:    { width: 1080, height: 1080 },
  portrait:  { width: 1080, height: 1350 },
  story:     { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 628 },
};

/**
 * Extract Google Fonts <link> URLs and convert them to @import statements.
 */
function extractFontImports(rawHtml) {
  const imports = [];
  const linkRe = /<link[^>]+href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"[^>]*>/g;
  let m;
  while ((m = linkRe.exec(rawHtml)) !== null) {
    imports.push(`@import url('${m[1]}');`);
  }
  return imports;
}

/**
 * Extract all CSS from <style> tags.
 */
function extractCss(rawHtml) {
  const parts = [];
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleRe.exec(rawHtml)) !== null) {
    parts.push(m[1].trim());
  }
  return parts.join('\n');
}

/**
 * Extract body innerHTML (everything between <body> and </body>).
 */
function extractBody(rawHtml) {
  const bodyRe = /<body[^>]*>([\s\S]*?)<\/body>/i;
  const m = bodyRe.exec(rawHtml);
  return m ? m[1].trim() : '';
}

/**
 * Adapt base CSS to a target layout by swapping container dimensions.
 * Mirrors render.js regex logic exactly.
 */
function adaptCssToLayout(baseCss, fontImports, width, height) {
  let css = baseCss
    .replace(/(html,\s*body\s*\{[^}]*width:)\s*\d+px/g, `$1${width}px`)
    .replace(/(html,\s*body\s*\{[^}]*height:)\s*\d+px/g, `$1${height}px`)
    .replace(/(\.card\s*\{[^}]*width:)\s*\d+px/g, `$1${width}px`)
    .replace(/(\.card\s*\{[^}]*height:)\s*\d+px/g, `$1${height}px`);

  if (fontImports.length) {
    css = fontImports.join('\n') + '\n' + css;
  }
  return css;
}

/**
 * Parse a raw HTML template and produce a template object matching the
 * existing pipeline interface: { id, name, fields, content, layouts, ... }
 */
function parseHtmlTemplate(rawHtml, { id, name, previewBucket, fields }) {
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
    previewBucket: previewBucket || 'square',
    fields,
    content: { html: bodyHtml },
    layouts,
    isAnimated: false,
    _htmlSource: true,
  };
}

// ── Template definitions ────────────────────────────────────────────────────

export const viralShockCardTemplate = parseHtmlTemplate(viralHtml, {
  id: 'viral-shock-card',
  name: 'Viral / Shock',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',       label: 'Photo',       type: 'image',    required: true },
    { key: 'BADGE',       label: 'Badge',        type: 'text',     required: true },
    { key: 'HEADLINE',    label: 'Headline',     type: 'textarea', required: true },
    { key: 'DESCRIPTION', label: 'Description',  type: 'textarea', required: false },
    { key: 'SOURCE',      label: 'Source',        type: 'text',     required: false },
  ],
});

export const highlightWireCardTemplate = parseHtmlTemplate(highlightHtml, {
  id: 'highlight-wire-card',
  name: 'Highlight / Wire',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',    label: 'Photo',    type: 'image',    required: true },
    { key: 'TAG',      label: 'Tag',      type: 'text',     required: true },
    { key: 'HEADLINE', label: 'Headline', type: 'textarea', required: true },
    { key: 'SUBTEXT',  label: 'Subtext',  type: 'textarea', required: false },
    { key: 'SOURCE',   label: 'Source',   type: 'text',     required: false },
  ],
});

export const bannerBoldCardTemplate = parseHtmlTemplate(bannerHtml, {
  id: 'banner-bold-card',
  name: 'Banner / Bold',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',       label: 'Photo',       type: 'image',    required: true },
    { key: 'BANNER_TEXT', label: 'Banner Text',  type: 'text',     required: true },
    { key: 'HEADLINE',    label: 'Headline',     type: 'textarea', required: true },
    { key: 'SOURCE',      label: 'Source',       type: 'text',     required: false },
  ],
});

export const stampBreakingCardTemplate = parseHtmlTemplate(stampHtml, {
  id: 'stamp-breaking-card',
  name: 'Stamp / Breaking',
  previewBucket: 'square',
  fields: [
    { key: 'PHOTO',          label: 'Photo',           type: 'image',    required: true },
    { key: 'DATELINE',       label: 'Dateline',        type: 'text',     required: false },
    { key: 'STAMP_TEXT',     label: 'Stamp Text',      type: 'text',     required: true },
    { key: 'HEADLINE_BIG',   label: 'Headline Big',    type: 'text',     required: true },
    { key: 'HEADLINE_ACCENT', label: 'Headline Accent', type: 'text',    required: false },
    { key: 'DESCRIPTION',    label: 'Description',     type: 'textarea', required: false },
    { key: 'SOURCE',         label: 'Source',           type: 'text',     required: false },
  ],
});

export const DEFAULT_TEMPLATE_ID = 'viral-shock-card';

export const HTML_TEMPLATES = {
  'viral-shock-card': viralShockCardTemplate,
  'highlight-wire-card': highlightWireCardTemplate,
  'banner-bold-card': bannerBoldCardTemplate,
  'stamp-breaking-card': stampBreakingCardTemplate,
};
