import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { config } from '../../config.js';

export async function seedAdmin() {
  const email = (config.admin.email || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = config.admin.password || process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.warn('  ⚠ ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user seed');
    return { ok: 0, skipped: true };
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
    return { ok: 1, id: existing[0].id };
  }

  const result = await query(
    `INSERT INTO users (email, password_hash, name, role, session_version, created_at, updated_at)
     VALUES (?, ?, 'Admin', 'admin', 0, ?, ?)`,
    [email, passwordHash, now, now]
  );
  console.log(`  admin created: ${email}`);
  return { ok: 1, id: result.insertId };
}
