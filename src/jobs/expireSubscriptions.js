import { expireSubscriptions } from '../services/subscriptionService.js';
import { testConnection, getPool } from '../database/db.js';

/**
 * Run the subscription expiry job once.
 * @returns {Promise<number>} Number of subscriptions expired
 */
export async function runExpireSubscriptionsJob() {
  const count = await expireSubscriptions();
  return count;
}

async function main() {
  try {
    await testConnection();
    const count = await runExpireSubscriptionsJob();
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Expired ${count} subscription(s)`);
    process.exit(0);
  } catch (error) {
    console.error('Expire subscriptions job failed:', error.message);
    process.exit(1);
  } finally {
    await getPool().end();
  }
}

const isDirectRun = process.argv[1]?.endsWith('expireSubscriptions.js');
if (isDirectRun) {
  main();
}
