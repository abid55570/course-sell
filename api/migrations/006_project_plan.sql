-- =========================================================================
-- Feature-ladder plans: the buyer picks a plan (basic/standard/premium) per
-- project. The plan drives the price + render params (length, photos, quality).
-- =========================================================================

ALTER TABLE video_projects ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'standard';

INSERT INTO schema_migrations (version) VALUES ('006_project_plan')
ON CONFLICT (version) DO NOTHING;
