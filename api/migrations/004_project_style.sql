-- =========================================================================
-- Buyer style customisation: a per-project `style` blob holding the chosen
-- palette name and optional accent / background colour overrides.
-- =========================================================================

ALTER TABLE video_projects ADD COLUMN IF NOT EXISTS style JSONB;

INSERT INTO schema_migrations (version) VALUES ('004_project_style')
ON CONFLICT (version) DO NOTHING;
