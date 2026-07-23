-- 003_templates_and_posts.sql
-- MariaDB 5.2.2 compatible: TEXT (not JSON), DATETIME timestamps, utf8 charset.

ALTER TABLE users
  ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user' AFTER session_version;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  label VARCHAR(120) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_categories_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS templates (
  id VARCHAR(120) NOT NULL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  category_id VARCHAR(64) NOT NULL,
  html_source MEDIUMTEXT NOT NULL,
  fields_json MEDIUMTEXT NOT NULL,
  preview_bucket VARCHAR(32) NOT NULL DEFAULT 'square',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_templates_category (category_id),
  INDEX idx_templates_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS saved_posts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  template_id VARCHAR(120) NOT NULL,
  caption TEXT,
  platform ENUM('facebook', 'instagram', 'linkedin', 'youtube', 'tiktok') NOT NULL,
  scheduled_at DATETIME NOT NULL,
  image_path VARCHAR(512) NOT NULL,
  field_data TEXT,
  format_bucket VARCHAR(32) NOT NULL DEFAULT 'square',
  status ENUM('scheduled', 'saved') NOT NULL DEFAULT 'scheduled',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES templates(id),
  INDEX idx_saved_posts_user (user_id),
  INDEX idx_saved_posts_scheduled (scheduled_at),
  INDEX idx_saved_posts_platform (platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
