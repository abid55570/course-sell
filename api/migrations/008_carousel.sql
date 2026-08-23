-- =========================================================================
-- Carousel / Post-Graphic Editor product tables.
--
-- carousel_templates: JSON-defined slide templates for the browser editor.
-- carousel_licenses: one-time purchase license keys that unlock all templates.
-- =========================================================================

CREATE TABLE IF NOT EXISTS carousel_templates (
  id          BIGSERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  slides      JSONB NOT NULL,
  dimensions  JSONB NOT NULL DEFAULT '{"width":1080,"height":1350}',
  fonts       TEXT[] DEFAULT ARRAY['Inter','Space Grotesk'],
  preview_url TEXT,
  is_free     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carousel_templates_category ON carousel_templates(category);
CREATE INDEX IF NOT EXISTS idx_carousel_templates_active ON carousel_templates(is_active);

CREATE TABLE IF NOT EXISTS carousel_licenses (
  id          BIGSERIAL PRIMARY KEY,
  license_key TEXT UNIQUE NOT NULL,
  buyer_email TEXT NOT NULL,
  order_id    TEXT REFERENCES orders(order_id),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carousel_licenses_email ON carousel_licenses(buyer_email);
CREATE INDEX IF NOT EXISTS idx_carousel_licenses_key ON carousel_licenses(license_key);

INSERT INTO schema_migrations (version) VALUES ('008_carousel')
ON CONFLICT (version) DO NOTHING;
