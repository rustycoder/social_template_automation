#!/usr/bin/env node
/**
 * Seed categories + HTML templates into the database, and upsert admin user.
 *
 * Usage: npm run db:seed-templates
 *
 * Requires ADMIN_EMAIL and ADMIN_PASSWORD in .env for admin user creation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { query, testConnection, getPool } from '../server/db.js';
import { config } from '../server/config.js';
import { upsertCategory } from '../server/services/categoryService.js';
import { upsertTemplateSeed } from '../server/services/templateService.js';
import { TEMPLATE_CATEGORIES } from '../src/templates/templateCategories.js';
import { LEGACY_TEMPLATE_REGISTRY } from '../src/templates/legacyTemplateRegistry.js';
import { NICHE_TEMPLATE_REGISTRY } from '../src/templates/nicheTemplateRegistry.js';
import { AUDIENCE_TEMPLATE_REGISTRY } from '../src/templates/audienceTemplateRegistry.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'src', 'templates');

const REGISTRY = [
  ...LEGACY_TEMPLATE_REGISTRY,
  ...NICHE_TEMPLATE_REGISTRY,
  ...AUDIENCE_TEMPLATE_REGISTRY,
];

async function seedCategories() {
  let sort = 0;
  for (const [id, label] of Object.entries(TEMPLATE_CATEGORIES)) {
    await upsertCategory({ id, label, sortOrder: sort++, isActive: 1 });
    console.log(`  category: ${id}`);
  }
}

async function seedTemplates() {
  let ok = 0;
  let missing = 0;

  for (const def of REGISTRY) {
    const filePath = path.join(TEMPLATES_DIR, def.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  missing file: ${def.file}`);
      missing++;
      continue;
    }

    const htmlSource = fs.readFileSync(filePath, 'utf8');
    const categoryId = TEMPLATE_CATEGORIES[def.category] ? def.category : 'general';

    await upsertTemplateSeed({
      id: def.id,
      name: def.name,
      categoryId,
      htmlSource,
      fields: def.fields || [],
      previewBucket: def.previewBucket || 'square',
      isActive: 1,
    });
    ok++;
    console.log(`  template: ${def.id}`);
  }

  return { ok, missing };
}

async function seedAdmin() {
  const email = (config.admin.email || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = config.admin.password || process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.warn('⚠ ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user seed');
    return null;
  }

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);

  if (existing[0]) {
    await query(
      `UPDATE users
       SET password_hash = ?, role = 'admin', name = COALESCE(NULLIF(name, ''), 'Admin'), updated_at = ?
       WHERE id = ?`,
      [passwordHash, now, existing[0].id]
    );
    console.log(`  admin updated: ${email}`);
    return existing[0].id;
  }

  const result = await query(
    `INSERT INTO users (email, password_hash, name, role, session_version, created_at, updated_at)
     VALUES (?, ?, 'Admin', 'admin', 0, ?, ?)`,
    [email, passwordHash, now, now]
  );
  console.log(`  admin created: ${email}`);
  return result.insertId;
}

async function main() {
  console.log('Seeding templates into database…');
  console.log(`  host: ${config.db.host}:${config.db.port}`);
  console.log(`  database: ${config.db.database}`);

  await testConnection();

  console.log('\nCategories:');
  await seedCategories();

  console.log('\nTemplates:');
  const { ok, missing } = await seedTemplates();

  console.log('\nAdmin user:');
  await seedAdmin();

  console.log(`\nDone. Templates upserted: ${ok}, missing files: ${missing}`);
  await getPool().end();
}

main().catch(async (error) => {
  console.error('\nSeed failed:', error.message);
  try {
    await getPool().end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
