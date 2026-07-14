-- 004_fields_json_mediumtext.sql
-- Sample images (esp. data URLs) exceeded TEXT (64KB). Use MEDIUMTEXT like html_source.

ALTER TABLE templates
  MODIFY COLUMN fields_json MEDIUMTEXT NOT NULL;
