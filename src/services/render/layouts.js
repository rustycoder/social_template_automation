/**
 * Parse template HTML into body + per-bucket layout CSS (mirrors frontend htmlTemplateLoader).
 */

export const LAYOUTS = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 628 },
};

const EMOJI_FACE = `@font-face{font-family:'EmojiF';src:local('Segoe UI Emoji'),local('Apple Color Emoji'),local('Noto Color Emoji'),local('Segoe UI Symbol');unicode-range:U+200D,U+FE0F,U+2300-23FF,U+2600-26FF,U+2700-27BF,U+FE00-FEFF,U+1F000-1FAFF,U+1F900-1F9FF,U+1F1E0-1F1FF,U+E0020-E007F;}`;

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

  css = css.replace(/(font-family\s*:\s*)([^;}\n]+)/gi, (match, prefix, families) => {
    if (families.includes('EmojiF')) return match;
    return `${prefix}${families.trimEnd()}, 'EmojiF'`;
  });

  if (fontImports.length) {
    css = `${fontImports.join('\n')}\n${css}`;
  }
  css = `${EMOJI_FACE}\n${css}`;
  return css;
}

/**
 * @param {string} rawHtml
 * @param {string} [formatBucket]
 * @returns {{ bodyHtml: string, css: string, width: number, height: number }}
 */
export function getLayoutDocumentParts(rawHtml, formatBucket = 'square') {
  const bucket = LAYOUTS[formatBucket] ? formatBucket : 'square';
  const { width, height } = LAYOUTS[bucket];
  const fontImports = extractFontImports(rawHtml);
  const baseCss = extractCss(rawHtml);
  const bodyHtml = extractBody(rawHtml);
  const css = adaptCssToLayout(baseCss, fontImports, width, height);
  return { bodyHtml, css, width, height, formatBucket: bucket };
}
