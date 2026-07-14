-- 005_field_data_mediumtext.sql
-- Post row field_data can include uploaded image data URLs that exceed TEXT (64KB).

ALTER TABLE saved_posts
  MODIFY COLUMN field_data MEDIUMTEXT NULL;
