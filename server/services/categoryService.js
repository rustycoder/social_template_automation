import { query } from '../database/db.js';
import { nowDatetime } from './jsonText.js';
import {
  getCached,
  setCached,
  invalidateTemplateCatalogCache,
} from './templateCache.js';

export async function listCategories({ activeOnly = true } = {}) {
  const cacheKey = `categories:${activeOnly ? 'active' : 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const rows = activeOnly
    ? await query(
        `SELECT id, label, sort_order AS sortOrder, is_active AS isActive,
                created_at AS createdAt, updated_at AS updatedAt
         FROM categories
         WHERE is_active = 1
         ORDER BY sort_order ASC, label ASC`
      )
    : await query(
        `SELECT id, label, sort_order AS sortOrder, is_active AS isActive,
                created_at AS createdAt, updated_at AS updatedAt
         FROM categories
         ORDER BY sort_order ASC, label ASC`
      );

  setCached(cacheKey, rows);
  return structuredClone(rows);
}

export async function getCategoryById(id) {
  const rows = await query(
    `SELECT id, label, sort_order AS sortOrder, is_active AS isActive,
            created_at AS createdAt, updated_at AS updatedAt
     FROM categories WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function createCategory({ id, label, sortOrder = 0, isActive = 1 }) {
  const now = nowDatetime();
  await query(
    `INSERT INTO categories (id, label, sort_order, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, label, sortOrder, isActive ? 1 : 0, now, now]
  );
  invalidateTemplateCatalogCache();
  return getCategoryById(id);
}

export async function upsertCategory({ id, label, sortOrder = 0, isActive = 1 }) {
  const now = nowDatetime();
  await query(
    `INSERT INTO categories (id, label, sort_order, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       label = VALUES(label),
       sort_order = VALUES(sort_order),
       is_active = VALUES(is_active),
       updated_at = VALUES(updated_at)`,
    [id, label, sortOrder, isActive ? 1 : 0, now, now]
  );
  invalidateTemplateCatalogCache();
  return getCategoryById(id);
}

export async function updateCategory(id, patch) {
  const existing = await getCategoryById(id);
  if (!existing) return null;

  const label = patch.label != null ? patch.label : existing.label;
  const sortOrder = patch.sortOrder != null ? patch.sortOrder : existing.sortOrder;
  const isActive =
    patch.isActive != null ? (patch.isActive ? 1 : 0) : existing.isActive ? 1 : 0;
  const now = nowDatetime();

  await query(
    `UPDATE categories
     SET label = ?, sort_order = ?, is_active = ?, updated_at = ?
     WHERE id = ?`,
    [label, sortOrder, isActive, now, id]
  );
  invalidateTemplateCatalogCache();
  return getCategoryById(id);
}

export async function deleteCategory(id) {
  const existing = await getCategoryById(id);
  if (!existing) return false;

  const templates = await query(
    'SELECT id FROM templates WHERE category_id = ? LIMIT 1',
    [id]
  );
  if (templates.length > 0) {
    const error = new Error('Category has templates; deactivate instead of deleting');
    error.status = 409;
    throw error;
  }

  await query('DELETE FROM categories WHERE id = ?', [id]);
  invalidateTemplateCatalogCache();
  return true;
}
