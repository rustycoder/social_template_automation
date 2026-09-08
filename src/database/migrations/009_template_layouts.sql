-- 009_template_layouts.sql
-- Per-aspect-ratio HTML overrides. html_source stays the base/primary layout;
-- layouts_json holds optional bucket-specific HTML: { "portrait": "<html>", "story": "<html>" }.
-- NULL / missing bucket => fall back to the scaled base html_source (legacy behavior).

ALTER TABLE templates
  ADD COLUMN layouts_json MEDIUMTEXT NULL AFTER html_source;
