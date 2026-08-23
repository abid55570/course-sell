-- =========================================================================
-- Env-driven pricing tiers for video templates. A template's `price_tier`
-- (low/mid/high) resolves to a price via the VIDEO_PRICE_* env vars, so prices
-- can be changed per occasion without editing rows.
-- =========================================================================

ALTER TABLE video_templates ADD COLUMN IF NOT EXISTS price_tier TEXT;

INSERT INTO schema_migrations (version) VALUES ('005_price_tier')
ON CONFLICT (version) DO NOTHING;
