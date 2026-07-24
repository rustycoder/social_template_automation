/**
 * Template placeholder substitution (mirrors frontend socialRenderHost.replacePlaceholders).
 */

function looksLikeUrl(value) {
  const v = String(value).trim().toLowerCase();
  return (
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('data:') ||
    v.startsWith('file:') ||
    v.startsWith('blob:') ||
    v.startsWith('/uploads/')
  );
}

function applyHighlights(value) {
  if (looksLikeUrl(value)) return String(value);
  return String(value)
    .replace(/\[\[(.+?)\]\]/g, '<span class="highlight-red">$1</span>')
    .replace(/\[(.+?)\]/g, '<mark>$1</mark>');
}

/**
 * @param {string} templateStr
 * @param {Record<string, string>} rowData
 */
export function replacePlaceholders(templateStr, rowData) {
  if (!templateStr) return '';

  const data = rowData && typeof rowData === 'object' ? rowData : {};
  let processedStr = templateStr;
  const ifRegex = /\{\{#if\s+([^}]+?)\s*\}\}([\s\S]*?)\{\{\/if\}\}/gi;
  let matchFound = true;
  let iterations = 0;

  while (matchFound && iterations < 10) {
    matchFound = false;
    processedStr = processedStr.replace(ifRegex, (match, key, content) => {
      matchFound = true;
      const trimmedKey = key.trim();
      const header = Object.keys(data).find(
        (h) => h.trim().toLowerCase() === trimmedKey.toLowerCase()
      );
      const value = header ? data[header] : null;

      if (value !== null && value !== undefined && String(value).trim() !== '') {
        return content;
      }
      return '';
    });
    iterations += 1;
  }

  return processedStr.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    const header = Object.keys(data).find(
      (h) => h.trim().toLowerCase() === trimmedKey.toLowerCase()
    );
    if (!header) return '';

    const value = data[header] ?? '';
    return applyHighlights(value);
  });
}
