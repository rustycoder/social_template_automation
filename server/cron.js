import cron from 'node-cron';
import { config } from './config.js';
import { testConnection, getPool } from './database/db.js';
import { runExpireSubscriptionsJob } from './jobs/expireSubscriptions.js';

let isRunning = false;

async function executeJob() {
  if (isRunning) {
    console.log('Expire job skipped — previous run still in progress');
    return;
  }

  isRunning = true;
  try {
    const count = await runExpireSubscriptionsJob();
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Cron: expired ${count} subscription(s)`);
  } catch (error) {
    console.error('Cron expire job failed:', error.message);
  } finally {
    isRunning = false;
  }
}

async function start() {
  try {
    await testConnection();
    console.log('MySQL connected');
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    process.exit(1);
  }

  const schedule = config.cron.expireSubscriptions;
  if (!cron.validate(schedule)) {
    console.error(`Invalid CRON_EXPIRE_SCHEDULE: "${schedule}"`);
    process.exit(1);
  }

  console.log(`Subscription expiry cron scheduled: "${schedule}"`);

  await executeJob();

  cron.schedule(schedule, executeJob);

  process.on('SIGINT', async () => {
    console.log('\nShutting down cron…');
    await getPool().end();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await getPool().end();
    process.exit(0);
  });
}

start();
