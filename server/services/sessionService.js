import { query } from '../db.js';

/**
 * @description Increments the user's session version, invalidating all prior JWTs.
 * @param {number | string} userId
 * @returns {Promise<number>}
 */
export async function bumpSessionVersion(userId) {
  await query('UPDATE users SET session_version = session_version + 1 WHERE id = ?', [userId]);
  const rows = await query('SELECT session_version FROM users WHERE id = ? LIMIT 1', [userId]);
  return Number(rows[0]?.session_version ?? 1);
}

/**
 * @description Returns true when the JWT session version matches the database.
 * @param {number | string} userId
 * @param {number | undefined} sessionVersion
 * @returns {Promise<boolean>}
 */
export async function validateSessionVersion(userId, sessionVersion) {
  if (sessionVersion === undefined || sessionVersion === null) {
    return false;
  }

  const rows = await query('SELECT session_version FROM users WHERE id = ? LIMIT 1', [userId]);
  if (!rows[0]) return false;

  return Number(rows[0].session_version) === Number(sessionVersion);
}
