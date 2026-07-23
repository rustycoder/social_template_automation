-- 007_utf8mb4_charset.sql
-- Convert template-related tables from utf8mb3 to utf8mb4 so HTML seed data can bind.

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE templates DROP FOREIGN KEY templates_ibfk_1;
ALTER TABLE saved_posts DROP FOREIGN KEY saved_posts_ibfk_1;
ALTER TABLE saved_posts DROP FOREIGN KEY saved_posts_ibfk_2;

ALTER TABLE categories
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE templates
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE saved_posts
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE templates
  ADD CONSTRAINT templates_ibfk_1
    FOREIGN KEY (category_id) REFERENCES categories(id);

ALTER TABLE saved_posts
  ADD CONSTRAINT saved_posts_ibfk_1
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE saved_posts
  ADD CONSTRAINT saved_posts_ibfk_2
    FOREIGN KEY (template_id) REFERENCES templates(id);

SET FOREIGN_KEY_CHECKS = 1;
