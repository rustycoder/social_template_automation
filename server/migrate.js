#!/usr/bin/env node
/**
 * Database migration runner.
 *
 * Usage:
 *   npm run db:migrate
 *   node server/migrate.js
 *   node server/migrate.js --fresh   # drop all tables and re-run migrations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { config } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const FRESH = process.argv.includes('--fresh');

async function createConnection({ withDatabase = true } = {}) {
  return mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: withDatabase ? config.db.database : undefined,
    multipleStatements: true,
  });
}

async function ensureDatabase() {
  const connection = await createConnection({ withDatabase: false });
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\`
       CHARACTER SET utf8
       COLLATE utf8_general_ci`
    );
    console.log(`✓ Database "${config.db.database}" ready`);
  } finally {
    await connection.end();
  }
}

async function ensureMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
}

async function getAppliedMigrations(connection) {
  const [rows] = await connection.query('SELECT name FROM schema_migrations ORDER BY name');
  return new Set(rows.map((row) => row.name));
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

async function dropAllTables(connection) {
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');

  const [tables] = await connection.query(
    `SELECT table_name AS tableName
     FROM information_schema.tables
     WHERE table_schema = ?`,
    [config.db.database]
  );

  for (const { tableName } of tables) {
    await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    console.log(`  dropped ${tableName}`);
  }

  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function runMigration(connection, filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filePath, 'utf8');

  console.log(`→ Running ${filename}`);
  await connection.query(sql);
  await connection.query('INSERT INTO schema_migrations (name) VALUES (?)', [filename]);
  console.log(`✓ Applied ${filename}`);
}

async function printSummary(connection) {
  const tables = [
    'users',
    'subscription_plans',
    'payment_transactions',
    'subscriptions',
    'categories',
    'templates',
    'saved_posts',
    'schema_migrations',
  ];

  console.log('\nTable row counts:');
  for (const table of tables) {
    try {
      const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
      console.log(`  ${table}: ${rows[0].count}`);
    } catch {
      console.log(`  ${table}: (not found)`);
    }
  }
}

async function migrate() {
  console.log('Starting database migration…');
  console.log(`  host: ${config.db.host}:${config.db.port}`);
  console.log(`  database: ${config.db.database}`);
  console.log(`  user: ${config.db.user}`);

  await ensureDatabase();

  const connection = await createConnection();

  try {
    if (FRESH) {
      console.log('\n--fresh: dropping all tables…');
      await dropAllTables(connection);
    }

    await ensureMigrationsTable(connection);

    const applied = await getAppliedMigrations(connection);
    const files = getMigrationFiles();

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`○ Skipped ${file} (already applied)`);
        continue;
      }
      await runMigration(connection, file);
      ran++;
    }

    if (ran === 0) {
      console.log('\nAll migrations already applied.');
    } else {
      console.log(`\n${ran} migration(s) applied successfully.`);
    }

    await printSummary(connection);
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error('\nMigration failed:', error.message);
  process.exit(1);
});
