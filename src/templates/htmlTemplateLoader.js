/**
 * Unified HTML Template Loader
 *
 * Parses HTML template strings into runtime template objects with
 * per-bucket layout CSS. Templates are loaded from the API (DB), not Vite glob.
 */

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

/**
 * @param {string} rawHtml
 * @param {{ id: string, name: string, category?: string, previewBucket?: string, fields?: object[] }} meta
 */
export function parseHtmlTemplate(rawHtml, { id, name, category, previewBucket, fields }) {
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
    fields: Array.isArray(fields) ? fields : [],
    content: { html: bodyHtml },
    layouts,
    isAnimated: false,
    _htmlSource: true,
  };
}

/**
 * Map API template rows into the runtime catalog.
 * @param {Array<object>} apiTemplates
 * @returns {Record<string, object>}
 */
export function buildTemplateCatalog(apiTemplates) {
  /** @type {Record<string, object>} */
  const templates = {};

  for (const row of apiTemplates || []) {
    const rawHtml = row.htmlSource || row.html_source || '';
    if (!rawHtml) {
      console.warn(`[htmlTemplateLoader] Template missing HTML: ${row.id}`);
      continue;
    }

    templates[row.id] = parseHtmlTemplate(rawHtml, {
      id: row.id,
      name: row.name,
      category: row.categoryId || row.category || 'general',
      previewBucket: row.previewBucket || 'square',
      fields: row.fields || [],
    });
  }

  return templates;
}

export const DEFAULT_TEMPLATE_ID = 'viral-shock-card';
