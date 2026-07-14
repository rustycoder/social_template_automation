/**
 * @file features/shared/formatHtml.js
 * @description Pretty-print HTML for the admin template editor without dropping {{placeholders}}.
 */

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * Light CSS formatting for inline &lt;style&gt; blocks.
 * @param {string} css
 * @returns {string}
 */
function formatCss(css) {
  const text = String(css ?? '').trim();
  if (!text) return '';

  let out = '';
  let indent = 0;
  const pad = () => '  '.repeat(indent);

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '{') {
      out = `${out.trimEnd()} {\n`;
      indent += 1;
      out += pad();
      continue;
    }
    if (ch === '}') {
      indent = Math.max(0, indent - 1);
      out = `${out.trimEnd()}\n${pad()}}\n${pad()}`;
      continue;
    }
    if (ch === ';') {
      out += ';\n' + pad();
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      continue;
    }
    out += ch;
  }

  return out
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line, idx, arr) => line.length > 0 || (idx > 0 && arr[idx - 1].length > 0))
    .join('\n')
    .trim();
}

/**
 * @param {string} tagName
 * @returns {boolean}
 */
function isVoid(tagName) {
  return VOID_TAGS.has(String(tagName || '').toLowerCase());
}

/**
 * Pretty-print HTML source for easier editing.
 * Preserves {{FIELD}} placeholders and does not run a full HTML parser.
 * @param {string} raw
 * @returns {string}
 */
export function formatHtmlSource(raw) {
  const src = String(raw ?? '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!src) return '';

  /** @type {Array<{ tag: string, attrs: string, body: string }>} */
  const blocks = [];
  const withBlocks = src.replace(
    /<(style|script)(\b[^>]*)>([\s\S]*?)<\/\1>/gi,
    (_m, tag, attrs, body) => {
      const idx = blocks.length;
      const formattedBody = tag.toLowerCase() === 'style' ? formatCss(body) : String(body).trim();
      blocks.push({ tag, attrs: attrs || '', body: formattedBody });
      return `\0BLOCK${idx}\0`;
    }
  );

  const tokens = withBlocks.split(/(<[^>]+>)/g).filter((t) => t.length > 0);
  let indent = 0;
  /** @type {string[]} */
  const lines = [];

  for (const token of tokens) {
    if (token.startsWith('<')) {
      const closeMatch = /^<\/\s*([a-zA-Z0-9:-]+)/.exec(token);
      const openMatch = /^<\s*([a-zA-Z0-9:-]+)/.exec(token);
      const isComment = /^<!--/.test(token) || /^<!DOCTYPE/i.test(token);
      const selfClosing = /\/>\s*$/.test(token);

      if (closeMatch) {
        indent = Math.max(0, indent - 1);
        lines.push(`${'  '.repeat(indent)}${token.trim()}`);
        continue;
      }

      lines.push(`${'  '.repeat(indent)}${token.trim()}`);

      if (
        !isComment &&
        openMatch &&
        !selfClosing &&
        !isVoid(openMatch[1]) &&
        !/^<\?/.test(token)
      ) {
        indent += 1;
      }
      continue;
    }

    const text = token.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    lines.push(`${'  '.repeat(indent)}${text}`);
  }

  let result = lines.join('\n');

  result = result.replace(/^([ \t]*)\0BLOCK(\d+)\0[ \t]*$/gm, (_m, indent, idxStr) => {
    const block = blocks[Number(idxStr)];
    if (!block) return '';
    const open = `<${block.tag}${block.attrs}>`;
    const close = `</${block.tag}>`;
    if (!block.body) return `${indent}${open}${close}`;
    const bodyLines = block.body
      .split('\n')
      .map((line) => (line.length ? `${indent}  ${line}` : `${indent}  `))
      .join('\n');
    return `${indent}${open}\n${bodyLines}\n${indent}${close}`;
  });

  // Fallback if placeholder was inlined with other text
  result = result.replace(/\0BLOCK(\d+)\0/g, (_m, idxStr) => {
    const block = blocks[Number(idxStr)];
    if (!block) return '';
    const open = `<${block.tag}${block.attrs}>`;
    const close = `</${block.tag}>`;
    if (!block.body) return `${open}${close}`;
    return `${open}\n${block.body}\n${close}`;
  });

  result = result
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return `${result}\n`;
}
