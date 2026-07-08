/**
 * Template field helpers — extraction, validation, and form building.
 */

/** @typedef {{ key: string, label: string, type: 'text'|'textarea'|'image', required?: boolean }} TemplateField */

const PLACEHOLDER_RE = /\{\{\s*([^#/}][^}]*?)\s*\}\}/g;

/**
 * @param {object} template
 * @returns {TemplateField[]}
 */
export function getTemplateFields(template) {
  if (Array.isArray(template?.fields) && template.fields.length > 0) {
    return template.fields.map((field) => ({
      key: field.key,
      label: field.label || field.key,
      type: field.type || 'text',
      required: field.required !== false && field.type !== 'image' ? !!field.required : !!field.required,
    }));
  }

  const html = template?.content?.html ?? '';
  const keys = new Set();
  let match;
  while ((match = PLACEHOLDER_RE.exec(html)) !== null) {
    const key = match[1].trim();
    if (key && !key.startsWith('#') && !key.startsWith('/')) {
      keys.add(key);
    }
  }

  return [...keys].map((key) => ({
    key,
    label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    type: key.toLowerCase().includes('image') ? 'image' : 'text',
    required: true,
  }));
}

/**
 * @param {object} template
 * @returns {string[]}
 */
export function getTemplateFieldKeys(template) {
  return getTemplateFields(template).map((field) => field.key);
}

/**
 * @param {object} template
 * @param {string[]} headers
 */
export function validateExcelHeaders(template, headers) {
  const fields = getTemplateFields(template);
  const normalizedHeaders = headers.map((h) => h.trim());
  const headerLower = normalizedHeaders.map((h) => h.toLowerCase());

  const matched = [];
  const missing = [];
  const missingRequired = [];

  for (const field of fields) {
    const idx = headerLower.indexOf(field.key.toLowerCase());
    if (idx >= 0) {
      matched.push({ field: field.key, header: normalizedHeaders[idx] });
    } else {
      missing.push(field.key);
      if (field.required) {
        missingRequired.push(field.key);
      }
    }
  }

  const matchedHeaderSet = new Set(matched.map((m) => m.header.toLowerCase()));
  const extra = normalizedHeaders.filter((h) => !matchedHeaderSet.has(h.toLowerCase()));

  return {
    fields,
    matched,
    missing,
    missingRequired,
    extra,
    isValid: missingRequired.length === 0,
  };
}

/**
 * @param {object} template
 * @param {Record<string, string>} fieldValues
 */
export function validateManualFields(template, fieldValues) {
  const fields = getTemplateFields(template);
  const missingRequired = fields
    .filter((field) => field.required)
    .filter((field) => {
      const value = fieldValues[field.key] ?? '';
      return !String(value).trim();
    })
    .map((field) => field.key);

  return {
    fields,
    missingRequired,
    isValid: missingRequired.length === 0,
  };
}

/**
 * @param {object} template
 * @param {Record<string, string>} fieldValues
 */
export function buildRowFromManualFields(template, fieldValues) {
  const row = {};
  for (const field of getTemplateFields(template)) {
    row[field.key] = fieldValues[field.key] ?? '';
  }
  return row;
}
