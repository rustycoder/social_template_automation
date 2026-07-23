#!/usr/bin/env node
/**
 * Database seeder — plans, categories, templates, and admin user.
 *
 * Usage: npm run db:seed
 *
 * Requires ADMIN_EMAIL and ADMIN_PASSWORD in .env for admin user creation.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection, getPool } from '../db.js';
import { config } from '../../config.js';
import { seedPlans } from './seedPlans.js';
import { seedCategories } from './seedCategories.js';
import { seedTemplates } from './seedTemplates.js';
import { seedAdmin } from './seedAdmin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

async function main() {
  console.log('Seeding database…');
  console.log(`  host: ${config.db.host}:${config.db.port}`);
  console.log(`  database: ${config.db.database}`);

  await testConnection();

  console.log('\nSubscription plans:');
  await seedPlans();

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
