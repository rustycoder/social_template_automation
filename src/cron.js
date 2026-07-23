import cron from 'node-cron';
import { config } from './config.js';
import { testConnection, getPool } from './database/db.js';
import { runExpireSubscriptionsJob } from './jobs/expireSubscriptions.js';
import { runPostSchedulerJob } from './jobs/postScheduler.js';

let isExpireRunning = false;
let isPublisherRunning = false;

async function executeExpireJob() {
  if (isExpireRunning) {
    console.log('Expire job skipped — previous run still in progress');
    return;
  }

  isExpireRunning = true;
  try {
    const count = await runExpireSubscriptionsJob();
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Cron: expired ${count} subscription(s)`);
  } catch (error) {
    console.error('Cron expire job failed:', error.message);
  } finally {
    isExpireRunning = false;
  }
}

async function executePostPublishJob() {
  if (isPublisherRunning) {
    return;
  }

  isPublisherRunning = true;
  try {
    const count = await runPostSchedulerJob();
    if (count > 0) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Cron: processed ${count} scheduled post(s)`);
    }
  } catch (error) {
    console.error('Cron post publish job failed:', error.message);
  } finally {
    isPublisherRunning = false;
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

  const expireSchedule = config.cron.expireSubscriptions;
  if (!cron.validate(expireSchedule)) {
    console.error(`Invalid CRON_EXPIRE_SCHEDULE: "${expireSchedule}"`);
    process.exit(1);
  }

  console.log(`Subscription expiry cron scheduled: "${expireSchedule}"`);
  cron.schedule(expireSchedule, executeExpireJob);

  // Scheduled post publisher: runs every 10 seconds
  const publishSchedule = '*/10 * * * * *';
  console.log(`Scheduled post publisher cron scheduled: "${publishSchedule}"`);
  cron.schedule(publishSchedule, executePostPublishJob);

  // Run immediately on boot
  await executeExpireJob();
  await executePostPublishJob();

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

