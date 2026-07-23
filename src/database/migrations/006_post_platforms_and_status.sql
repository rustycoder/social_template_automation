-- 006_post_platforms_and_status.sql
-- Multi-platform posts + workflow statuses.
-- Status slugs: preparing | ready | completed

ALTER TABLE saved_posts
  ADD COLUMN platforms TEXT NULL AFTER caption;

UPDATE saved_posts
SET platforms = CONCAT('["', platform, '"]')
WHERE (platforms IS NULL OR platforms = '')
  AND platform IS NOT NULL
  AND platform != '';

UPDATE saved_posts
SET platforms = '[]'
WHERE platforms IS NULL OR platforms = '';

ALTER TABLE saved_posts
  MODIFY COLUMN status VARCHAR(64) NOT NULL DEFAULT 'preparing';

UPDATE saved_posts
SET status = CASE
  WHEN status IN ('saved', 'preparing') THEN 'preparing'
  WHEN status IN ('scheduled', 'ready') THEN 'ready'
  WHEN status = 'completed' THEN 'completed'
  ELSE 'preparing'
END;

ALTER TABLE saved_posts
  DROP INDEX idx_saved_posts_platform;

ALTER TABLE saved_posts
  DROP COLUMN platform;
