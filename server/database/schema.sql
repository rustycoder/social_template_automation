-- Social Media Template Automation — MySQL schema (legacy SQL setup)
-- Prefer: npm run db:migrate
-- Or run manually: mysql -u root -p < server/database/schema.sql

CREATE DATABASE IF NOT EXISTS social_template_automation
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE social_template_automation;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  price_cents INT UNSIGNED NOT NULL,
  billing_interval ENUM('month', 'year') NOT NULL,
  description TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscriptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  plan_id VARCHAR(32) NOT NULL,
  status ENUM('active', 'cancelled', 'expired') NOT NULL DEFAULT 'active',
  starts_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
  INDEX idx_subscriptions_user_status (user_id, status),
  INDEX idx_subscriptions_expires (expires_at)
) ENGINE=InnoDB;

INSERT INTO subscription_plans (id, name, price_cents, billing_interval, description)
VALUES
  ('monthly', 'Monthly Pro', 5000, 'month', 'Full access to all templates and unlimited downloads — billed monthly.'),
  ('yearly', 'Yearly Pro', 49900, 'year', 'Full access to all templates and unlimited downloads — billed yearly.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price_cents = VALUES(price_cents),
  billing_interval = VALUES(billing_interval),
  description = VALUES(description);
