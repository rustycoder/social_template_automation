-- 002_add_session_version.sql
-- Single active session per user: JWT must match users.session_version.

ALTER TABLE users
  ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER name;
