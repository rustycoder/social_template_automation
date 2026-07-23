/**
 * In-memory cache for public template / category list responses.
 * Cleared on any template or category mutation within this process.
 * Also expires after TTL so external seed/updates eventually refresh.
 */

const DEFAULT_TTL_MS = 60_000;

/** @type {Map<string, { value: unknown, expiresAt: number }>} */
const store = new Map();

export function getCached(key, ttlMs = DEFAULT_TTL_MS) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return structuredClone(entry.value);
}

export function setCached(key, value, ttlMs = DEFAULT_TTL_MS) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateTemplateCatalogCache() {
  store.clear();
}
