/**
 * Shared helpers for MariaDB 5.2.2–compatible TEXT JSON columns.
 */

export function parseJsonText(value, fallback) {
  if (value == null || value === '') {
    return fallback;
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function stringifyJsonText(value) {
  return JSON.stringify(value ?? null);
}

export function nowDatetime() {
  return new Date();
}

/**
 * @param {string} name
 * @returns {string}
 */
export function slugifyId(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || `template-${Date.now()}`;
}
