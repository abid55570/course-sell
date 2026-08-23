-- =========================================================================
-- Store course thumbnails inline as binary instead of (or alongside) the
-- file URL. The existing `thumbnail` column keeps a URL pointer that the
-- frontend uses; for binary-backed thumbnails it points to
-- /api/courses/<slug>/thumbnail and the bytes live in thumbnail_data.
-- =========================================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_data BYTEA;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_mime TEXT;

INSERT INTO schema_migrations (version) VALUES ('002_thumbnail_binary')
ON CONFLICT (version) DO NOTHING;
