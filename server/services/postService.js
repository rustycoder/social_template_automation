import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db.js';
import { config } from '../config.js';
import { nowDatetime, parseJsonText, stringifyJsonText } from './jsonText.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PLATFORMS = new Set(['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok']);

const DATA_URL_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s;

/**
 * Write any data-URL image values in field_data to disk and replace with /uploads URLs.
 * Prevents field_data from bloating past DB limits.
 * @param {number|string} userId
 * @param {object} fieldData
 * @returns {object}
 */
export function materializeFieldDataImages(userId, fieldData) {
  if (!fieldData || typeof fieldData !== 'object' || Array.isArray(fieldData)) {
    return fieldData && typeof fieldData === 'object' ? fieldData : {};
  }

  const postsDir = ensureUploadsDir();
  const fieldDir = path.join(postsDir, 'fields', String(userId));
  if (!fs.existsSync(fieldDir)) {
    fs.mkdirSync(fieldDir, { recursive: true });
  }

  const out = {};
  for (const [key, value] of Object.entries(fieldData)) {
    if (typeof value !== 'string') {
      out[key] = value;
      continue;
    }

    const match = DATA_URL_RE.exec(value);
    if (!match) {
      out[key] = value;
      continue;
    }

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
    const safeKey = String(key || 'image')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 64);
    const filename = `${safeKey}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    fs.writeFileSync(path.join(fieldDir, filename), Buffer.from(match[2], 'base64'));
    out[key] = `/uploads/posts/fields/${userId}/${filename}`;
  }
  return out;
}

export function getUploadsRoot() {
  if (config.uploadsDir) {
    return config.uploadsDir;
  }
  return path.join(__dirname, '..', 'uploads');
}

export function ensureUploadsDir() {
  const root = getUploadsRoot();
  const postsDir = path.join(root, 'posts');
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }
  return postsDir;
}

function mapPostRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email || row.userEmail || null,
    userName: row.user_name || row.userName || null,
    templateId: row.template_id,
    templateName: row.template_name || row.templateName || null,
    caption: row.caption || '',
    platform: row.platform,
    scheduledAt: row.scheduled_at,
    imagePath: row.image_path,
    imageUrl: row.image_path ? `/uploads/${row.image_path.replace(/^\/+/, '')}` : null,
    fieldData: parseJsonText(row.field_data, {}),
    formatBucket: row.format_bucket,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function normalizePlatform(value) {
  const platform = String(value || '')
    .trim()
    .toLowerCase();
  if (!PLATFORMS.has(platform)) {
    const error = new Error(
      `Invalid platform. Allowed: ${[...PLATFORMS].join(', ')}`
    );
    error.status = 400;
    throw error;
  }
  return platform;
}

/**
 * @param {string|Date} value
 */
export function normalizeScheduledAt(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error('Invalid scheduled_at datetime');
    error.status = 400;
    throw error;
  }
  return date;
}

export async function listPostsForUser(userId) {
  const rows = await query(
    `SELECT id, user_id, template_id, caption, platform, scheduled_at, image_path,
            field_data, format_bucket, status, created_at, updated_at
     FROM saved_posts
     WHERE user_id = ?
     ORDER BY scheduled_at DESC, id DESC`,
    [userId]
  );
  return rows.map(mapPostRow);
}

/**
 * Admin: all saved posts with user + template context.
 */
export async function listAllPosts() {
  const rows = await query(
    `SELECT p.id, p.user_id, p.template_id, p.caption, p.platform, p.scheduled_at,
            p.image_path, p.field_data, p.format_bucket, p.status, p.created_at, p.updated_at,
            u.email AS user_email, u.name AS user_name,
            t.name AS template_name
     FROM saved_posts p
     LEFT JOIN users u ON u.id = p.user_id
     LEFT JOIN templates t ON t.id = p.template_id
     ORDER BY p.scheduled_at DESC, p.id DESC`
  );
  return rows.map(mapPostRow);
}

export async function getPostById(id, userId = null) {
  const rows = userId
    ? await query(
        `SELECT id, user_id, template_id, caption, platform, scheduled_at, image_path,
                field_data, format_bucket, status, created_at, updated_at
         FROM saved_posts WHERE id = ? AND user_id = ? LIMIT 1`,
        [id, userId]
      )
    : await query(
        `SELECT p.id, p.user_id, p.template_id, p.caption, p.platform, p.scheduled_at,
                p.image_path, p.field_data, p.format_bucket, p.status, p.created_at, p.updated_at,
                u.email AS user_email, u.name AS user_name,
                t.name AS template_name
         FROM saved_posts p
         LEFT JOIN users u ON u.id = p.user_id
         LEFT JOIN templates t ON t.id = p.template_id
         WHERE p.id = ?
         LIMIT 1`,
        [id]
      );
  return mapPostRow(rows[0]);
}

/**
 * @param {object} input
 * @param {Buffer} input.imageBuffer
 */
export async function createPost({
  userId,
  templateId,
  caption,
  platform,
  scheduledAt,
  imageBuffer,
  fieldData,
  formatBucket = 'square',
  status = 'scheduled',
}) {
  const template = await query('SELECT id FROM templates WHERE id = ? LIMIT 1', [templateId]);
  if (!template[0]) {
    const error = new Error('Invalid template_id');
    error.status = 400;
    throw error;
  }

  const normalizedPlatform = normalizePlatform(platform || 'instagram');
  const when = normalizeScheduledAt(
    scheduledAt || new Date(Date.now() + 60 * 60 * 1000)
  );
  const postsDir = ensureUploadsDir();
  const filename = `post_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;
  const relativePath = path.join('posts', filename).replace(/\\/g, '/');
  const absolutePath = path.join(postsDir, filename);
  fs.writeFileSync(absolutePath, imageBuffer);

  const storedFieldData = materializeFieldDataImages(userId, fieldData ?? {});

  const now = nowDatetime();
  const result = await query(
    `INSERT INTO saved_posts
      (user_id, template_id, caption, platform, scheduled_at, image_path, field_data,
       format_bucket, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      templateId,
      caption ?? '',
      normalizedPlatform,
      when,
      relativePath,
      stringifyJsonText(storedFieldData),
      formatBucket || 'square',
      status === 'scheduled' ? 'scheduled' : 'saved',
      now,
      now,
    ]
  );

  return getPostById(result.insertId, userId);
}

export async function deletePost(id, userId) {
  const post = await getPostById(id, userId);
  if (!post) return false;

  const absolutePath = path.join(getUploadsRoot(), post.imagePath);
  try {
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    console.warn('Failed to delete post image:', error.message);
  }

  await query('DELETE FROM saved_posts WHERE id = ? AND user_id = ?', [id, userId]);
  return true;
}

/**
 * Update post metadata (caption, platform, schedule, status).
 * @param {number} id
 * @param {object} patch
 * @param {number|null} [userId] When set, only that owner's post can be updated.
 */
export async function updatePost(id, patch, userId = null) {
  const existing = await getPostById(id, userId);
  if (!existing) return null;

  const caption = patch.caption != null ? String(patch.caption) : existing.caption;
  const platform =
    patch.platform != null ? normalizePlatform(patch.platform) : existing.platform;
  const scheduledAt =
    patch.scheduledAt != null || patch.scheduled_at != null
      ? normalizeScheduledAt(patch.scheduledAt ?? patch.scheduled_at)
      : existing.scheduledAt;
  let status = existing.status;
  if (patch.status != null) {
    status = patch.status === 'saved' ? 'saved' : 'scheduled';
  } else if (patch.scheduledAt != null || patch.scheduled_at != null) {
    status = 'scheduled';
  }

  const now = nowDatetime();
  await query(
    `UPDATE saved_posts
     SET caption = ?, platform = ?, scheduled_at = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    [caption, platform, scheduledAt, status, now, id]
  );

  return getPostById(id, userId);
}

/**
 * Admin delete (any user's post).
 */
export async function deletePostAsAdmin(id) {
  const post = await getPostById(id);
  if (!post) return false;

  if (post.imagePath) {
    const absolutePath = path.join(getUploadsRoot(), post.imagePath);
    try {
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (error) {
      console.warn('Failed to delete post image:', error.message);
    }
  }

  await query('DELETE FROM saved_posts WHERE id = ?', [id]);
  return true;
}
