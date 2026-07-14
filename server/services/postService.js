import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db.js';
import { config } from '../config.js';
import { nowDatetime, parseJsonText, stringifyJsonText } from './jsonText.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PLATFORMS = new Set(['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok']);

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
    templateId: row.template_id,
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

export async function getPostById(id, userId = null) {
  const rows = userId
    ? await query(
        `SELECT id, user_id, template_id, caption, platform, scheduled_at, image_path,
                field_data, format_bucket, status, created_at, updated_at
         FROM saved_posts WHERE id = ? AND user_id = ? LIMIT 1`,
        [id, userId]
      )
    : await query(
        `SELECT id, user_id, template_id, caption, platform, scheduled_at, image_path,
                field_data, format_bucket, status, created_at, updated_at
         FROM saved_posts WHERE id = ? LIMIT 1`,
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

  const normalizedPlatform = normalizePlatform(platform);
  const when = normalizeScheduledAt(scheduledAt);
  const postsDir = ensureUploadsDir();
  const filename = `post_${userId}_${Date.now()}.png`;
  const relativePath = path.join('posts', filename).replace(/\\/g, '/');
  const absolutePath = path.join(postsDir, filename);
  fs.writeFileSync(absolutePath, imageBuffer);

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
      stringifyJsonText(fieldData ?? {}),
      formatBucket || 'square',
      status === 'saved' ? 'saved' : 'scheduled',
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
