import { query } from '../database/db.js';
import { socialPublisher } from '../services/socialPublisher.js';
import { stringifyJsonText, parseJsonText } from '../services/jsonText.js';

/**
 * Background job to check for scheduled posts that are due for publication,
 * simulates publishing to connected APIs, and updates their status/logs.
 * @returns {Promise<number>} Number of posts processed
 */
export async function runPostSchedulerJob() {
  const now = new Date();

  // Find posts: status = 'ready' (Ready for Scheduling) and scheduled_at <= NOW()
  const posts = await query(
    `SELECT id, user_id, caption, platforms, scheduled_at, image_path, status
     FROM saved_posts
     WHERE status = 'ready' AND scheduled_at <= ?`,
    [now]
  );

  if (posts.length === 0) {
    return 0;
  }

  console.log(`[PostScheduler] Found ${posts.length} post(s) due for publishing.`);

  for (const post of posts) {
    let platformsList = [];
    try {
      if (post.platforms) {
        platformsList = typeof post.platforms === 'string' ? JSON.parse(post.platforms) : post.platforms;
      }
    } catch (e) {
      console.warn(`[PostScheduler] Failed to parse platforms for post ${post.id}:`, post.platforms);
      platformsList = [];
    }

    if (!Array.isArray(platformsList) || platformsList.length === 0) {
      console.log(`[PostScheduler] Post ${post.id} has no platforms specified. Marking completed.`);
      await query(
        `UPDATE saved_posts SET status = 'completed', publish_log = ?, updated_at = NOW() WHERE id = ?`,
        [stringifyJsonText({ message: 'No platforms selected for posting' }), post.id]
      );
      continue;
    }

    // Fetch user's social connections
    const connections = await query(
      `SELECT id, platform, token, profile_name, profile_picture
       FROM social_connections
       WHERE user_id = ?`,
      [post.user_id]
    );

    const connectionMap = new Map(connections.map((c) => [c.platform, c]));

    const logs = {};
    let successCount = 0;
    let failCount = 0;

    for (const platform of platformsList) {
      const conn = connectionMap.get(platform);
      if (!conn) {
        logs[platform] = {
          success: false,
          error: `Platform not connected. Open Profile -> Social Connections to link your account.`,
        };
        failCount++;
        continue;
      }

      // Simulate publishing
      const result = await socialPublisher.publish(platform, {
        id: post.id,
        userId: post.user_id,
        caption: post.caption,
        imagePath: post.image_path,
      }, conn);

      logs[platform] = result;
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // Determine final status
    let finalStatus = 'completed';
    if (successCount === 0 && failCount > 0) {
      finalStatus = 'failed';
    } else if (failCount > 0) {
      // Mixed success/failure
      finalStatus = 'failed';
    }

    console.log(`[PostScheduler] Post ${post.id} publication finished. Status: ${finalStatus}. Successes: ${successCount}, Failures: ${failCount}`);

    await query(
      `UPDATE saved_posts
       SET status = ?, publish_log = ?, updated_at = NOW()
       WHERE id = ?`,
      [finalStatus, stringifyJsonText(logs), post.id]
    );
  }

  return posts.length;
}

async function main() {
  const { testConnection, getPool } = await import('../database/db.js');
  try {
    await testConnection();
    const count = await runPostSchedulerJob();
    console.log(`[Job finished] Processed ${count} scheduled posts.`);
    process.exit(0);
  } catch (error) {
    console.error('Post scheduler job failed:', error.message);
    process.exit(1);
  } finally {
    const pool = getPool();
    if (pool) {
      await pool.end();
    }
  }
}

const isDirectRun = process.argv[1]?.endsWith('postScheduler.js');
if (isDirectRun) {
  main();
}
