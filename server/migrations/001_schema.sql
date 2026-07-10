-- 001_schema.sql
-- Full database schema for Social Media Template Automation.
-- Run: npm run db:reset

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

CREATE TABLE IF NOT EXISTS payment_transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  plan_id VARCHAR(32) NOT NULL,
  order_id VARCHAR(80) NOT NULL,
  amount_cents INT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  mpgs_session_id VARCHAR(128) NULL,
  success_indicator VARCHAR(128) NULL,
  mpgs_transaction_id VARCHAR(128) NULL,
  subscription_id INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
  UNIQUE KEY uk_payment_order_id (order_id),
  INDEX idx_payment_user_status (user_id, status),
  INDEX idx_payment_subscription (subscription_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscriptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  plan_id VARCHAR(32) NOT NULL,
  payment_transaction_id INT UNSIGNED NULL,
  status ENUM('active', 'cancelled', 'expired') NOT NULL DEFAULT 'active',
  starts_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
  FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id) ON DELETE SET NULL,
  INDEX idx_subscriptions_user_status (user_id, status),
  INDEX idx_subscriptions_expires (expires_at),
  INDEX idx_subscriptions_payment (payment_transaction_id)
) ENGINE=InnoDB;

ALTER TABLE payment_transactions
  ADD CONSTRAINT fk_payment_transactions_subscription
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

INSERT INTO subscription_plans (id, name, price_cents, billing_interval, description)
VALUES
  ('monthly', 'Monthly Pro', 5000, 'month', 'Full access to all templates and unlimited downloads — billed monthly.'),
  ('yearly', 'Yearly Pro', 49900, 'year', 'Full access to all templates and unlimited downloads — billed yearly.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price_cents = VALUES(price_cents),
  billing_interval = VALUES(billing_interval),
  description = VALUES(description);
