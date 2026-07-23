import fs from 'fs';
import path from 'path';
import { query } from '../database/db.js';
import { nowDatetime, parseJsonText, stringifyJsonText, slugifyId } from './jsonText.js';
import { getUploadsRoot } from './postService.js';
import {
  getCached,
  setCached,
  invalidateTemplateCatalogCache,
} from './templateCache.js';

const DATA_URL_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;

/**
 * Persist data-URL sample images to disk and replace with /uploads/… URLs.
 * Keeps fields_json small enough for the DB.
 * @param {string} templateId
 * @param {Array<object>} fields
 * @returns {Array<object>}
 */
export function materializeFieldSampleImages(templateId, fields) {
  if (!Array.isArray(fields) || fields.length === 0) return fields || [];

  const safeId = String(templateId || 'template')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 80);
  const dir = path.join(getUploadsRoot(), 'templates', safeId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return fields.map((field) => {
    const sample = typeof field?.sample === 'string' ? field.sample : '';
    const match = DATA_URL_RE.exec(sample);
    if (!match) return field;

    const mime = match[1].toLowerCase();
    const ext =
      mime === 'image/png'
        ? 'png'
        : mime === 'image/webp'
          ? 'webp'
          : mime === 'image/gif'
            ? 'gif'
            : mime === 'image/svg+xml'
              ? 'svg'
              : 'jpg';
    const key = String(field.key || 'image')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toUpperCase()
      .slice(0, 64);
    const filename = `${key}.${ext}`;
    const absolute = path.join(dir, filename);
    fs.writeFileSync(absolute, Buffer.from(match[2], 'base64'));
    const publicPath = `/uploads/templates/${safeId}/${filename}`;
    return { ...field, sample: publicPath };
  });
}

function mapTemplateRow(row, { includeHtml = false } = {}) {
  if (!row) return null;
  const fields = parseJsonText(row.fields_json ?? row.fieldsJson, []);
  const base = {
    id: row.id,
    name: row.name,
    categoryId: row.category_id ?? row.categoryId,
    category: row.category_id ?? row.categoryId,
    previewBucket: (row.preview_bucket ?? row.previewBucket) || 'square',
    fields: Array.isArray(fields) ? fields : [],
    isActive: !!(row.is_active ?? row.isActive),
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
  if (includeHtml) {
    base.htmlSource = row.html_source ?? row.htmlSource ?? '';
  }
  return base;
}

/**
 * Extract {{FIELD}} placeholder keys from HTML (excludes {{#if}} / {{/if}}).
 * @param {string} html
 * @returns {string[]}
 */
export function extractPlaceholderKeys(html) {
  const keys = new Set();
  const re = /\{\{\s*([^#/}][^}]*?)\s*\}\}/g;
  let match;
  while ((match = re.exec(html || '')) !== null) {
    const key = match[1].trim();
    if (key) keys.add(key);
  }
  return [...keys];
}

/**
 * @param {string} html
 * @param {Array<{key: string}>} fields
 */
export function validateFieldsAgainstHtml(html, fields) {
  if (!Array.isArray(fields) || fields.length === 0) {
    const error = new Error('fields_json must be a non-empty array');
    error.status = 400;
    throw error;
  }

  for (const field of fields) {
    if (!field?.key || typeof field.key !== 'string') {
      const error = new Error('Each field must have a string key');
      error.status = 400;
      throw error;
    }
  }

  const placeholders = new Set(extractPlaceholderKeys(html).map((k) => k.toUpperCase()));
  const missingInHtml = fields
    .map((f) => f.key)
    .filter((key) => !placeholders.has(key.toUpperCase()));

  if (missingInHtml.length > 0) {
    const error = new Error(
      `Declared fields missing from HTML placeholders: ${missingInHtml.join(', ')}`
    );
    error.status = 400;
    throw error;
  }
}

export async function listTemplates({ activeOnly = true, includeHtml = false } = {}) {
  const cacheKey = `templates:${activeOnly ? 'active' : 'all'}:${includeHtml ? 'html' : 'meta'}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const htmlCol = includeHtml ? ', t.html_source' : '';
  const sql = activeOnly
    ? `SELECT t.id, t.name, t.category_id, t.fields_json, t.preview_bucket, t.is_active,
              t.created_at, t.updated_at${htmlCol}
       FROM templates t
       WHERE t.is_active = 1
       ORDER BY t.name ASC`
    : `SELECT t.id, t.name, t.category_id, t.fields_json, t.preview_bucket, t.is_active,
              t.created_at, t.updated_at${htmlCol}
       FROM templates t
       ORDER BY t.name ASC`;

  const rows = await query(sql);
  const templates = rows.map((row) => mapTemplateRow(row, { includeHtml }));
  setCached(cacheKey, templates);
  return structuredClone(templates);
}

export async function getTemplateById(id, { includeHtml = true } = {}) {
  const rows = await query(
    `SELECT id, name, category_id, html_source, fields_json, preview_bucket, is_active,
            created_at, updated_at
     FROM templates WHERE id = ? LIMIT 1`,
    [id]
  );
  return mapTemplateRow(rows[0], { includeHtml });
}

export async function createTemplate({
  id,
  name,
  categoryId,
  htmlSource,
  fields,
  previewBucket = 'square',
  isActive = 1,
}) {
  const templateId = id || slugifyId(name);
  validateFieldsAgainstHtml(htmlSource, fields);

  const category = await query('SELECT id FROM categories WHERE id = ? LIMIT 1', [categoryId]);
  if (!category[0]) {
    const error = new Error('Invalid category_id');
    error.status = 400;
    throw error;
  }

  const existing = await query('SELECT id FROM templates WHERE id = ? LIMIT 1', [templateId]);
  if (existing[0]) {
    const error = new Error('Template id already exists');
    error.status = 409;
    throw error;
  }

  const now = nowDatetime();
  const storedFields = materializeFieldSampleImages(templateId, fields);
  await query(
    `INSERT INTO templates
      (id, name, category_id, html_source, fields_json, preview_bucket, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      templateId,
      name,
      categoryId,
      htmlSource,
      stringifyJsonText(storedFields),
      previewBucket || 'square',
      isActive ? 1 : 0,
      now,
      now,
    ]
  );

  invalidateTemplateCatalogCache();
  return getTemplateById(templateId, { includeHtml: true });
}

export async function updateTemplate(id, patch) {
  const existing = await getTemplateById(id, { includeHtml: true });
  if (!existing) return null;

  const name = patch.name != null ? patch.name : existing.name;
  const categoryId = patch.categoryId != null ? patch.categoryId : existing.categoryId;
  const htmlSource = patch.htmlSource != null ? patch.htmlSource : existing.htmlSource;
  const fields = patch.fields != null ? patch.fields : existing.fields;
  const previewBucket =
    patch.previewBucket != null ? patch.previewBucket : existing.previewBucket;
  const isActive =
    patch.isActive != null ? (patch.isActive ? 1 : 0) : existing.isActive ? 1 : 0;

  if (patch.categoryId != null) {
    const category = await query('SELECT id FROM categories WHERE id = ? LIMIT 1', [categoryId]);
    if (!category[0]) {
      const error = new Error('Invalid category_id');
      error.status = 400;
      throw error;
    }
  }

  validateFieldsAgainstHtml(htmlSource, fields);

  const now = nowDatetime();
  const storedFields = materializeFieldSampleImages(id, fields);
  await query(
    `UPDATE templates
     SET name = ?, category_id = ?, html_source = ?, fields_json = ?,
         preview_bucket = ?, is_active = ?, updated_at = ?
     WHERE id = ?`,
    [
      name,
      categoryId,
      htmlSource,
      stringifyJsonText(storedFields),
      previewBucket,
      isActive,
      now,
      id,
    ]
  );

  invalidateTemplateCatalogCache();
  return getTemplateById(id, { includeHtml: true });
}

export async function softDeleteTemplate(id) {
  const existing = await getTemplateById(id, { includeHtml: false });
  if (!existing) return false;
  const now = nowDatetime();
  await query('UPDATE templates SET is_active = 0, updated_at = ? WHERE id = ?', [now, id]);
  invalidateTemplateCatalogCache();
  return true;
}

/**
 * Permanently remove a template. Fails if saved posts still reference it.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function hardDeleteTemplate(id) {
  const existing = await getTemplateById(id, { includeHtml: false });
  if (!existing) return false;

  const posts = await query(
    'SELECT COUNT(*) AS cnt FROM saved_posts WHERE template_id = ?',
    [id]
  );
  const count = Number(posts[0]?.cnt || 0);
  if (count > 0) {
    const error = new Error(
      `Cannot delete template while ${count} saved post(s) reference it. Deactivate instead.`
    );
    error.status = 409;
    throw error;
  }

  await query('DELETE FROM templates WHERE id = ?', [id]);
  invalidateTemplateCatalogCache();
  return true;
}

/**
 * Upsert for seed script (skips placeholder validation — registries are trusted).
 */
export async function upsertTemplateSeed({
  id,
  name,
  categoryId,
  htmlSource,
  fields,
  previewBucket = 'square',
  isActive = 1,
}) {
  const category = await query('SELECT id FROM categories WHERE id = ? LIMIT 1', [categoryId]);
  if (!category[0]) {
    const error = new Error(`Invalid category_id: ${categoryId}`);
    error.status = 400;
    throw error;
  }

  const now = nowDatetime();
  const fieldsText = stringifyJsonText(fields || []);
  const existing = await query('SELECT id FROM templates WHERE id = ? LIMIT 1', [id]);

  if (existing[0]) {
    await query(
      `UPDATE templates
       SET name = ?, category_id = ?, html_source = ?, fields_json = ?,
           preview_bucket = ?, is_active = ?, updated_at = ?
       WHERE id = ?`,
      [name, categoryId, htmlSource, fieldsText, previewBucket || 'square', isActive ? 1 : 0, now, id]
    );
  } else {
    await query(
      `INSERT INTO templates
        (id, name, category_id, html_source, fields_json, preview_bucket, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        categoryId,
        htmlSource,
        fieldsText,
        previewBucket || 'square',
        isActive ? 1 : 0,
        now,
        now,
      ]
    );
  }

  invalidateTemplateCatalogCache();
  return getTemplateById(id, { includeHtml: false });
}
