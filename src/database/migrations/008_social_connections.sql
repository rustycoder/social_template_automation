-- 008_social_connections.sql
-- Create table for social media connections and add logs column to saved posts.

CREATE TABLE IF NOT EXISTS social_connections (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  platform ENUM('facebook', 'instagram', 'linkedin', 'youtube', 'tiktok') NOT NULL,
  token TEXT NOT NULL,
  profile_name VARCHAR(255) NULL,
  profile_picture VARCHAR(512) NULL,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_platform (user_id, platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE saved_posts
  ADD COLUMN publish_log TEXT NULL AFTER status;
