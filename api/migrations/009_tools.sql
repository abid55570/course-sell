-- =========================================================================
-- One-time creator tools: shared tables that power six license-gated tools
--   biodata      Marriage Biodata Maker
--   festival     Festival Offer Poster Generator
--   certificate  Bulk Certificate Generator
--   idcard       ID Card Generator
--   qrmenu       QR Menu / Price-List Maker
--   rentreceipt  Rent Receipt (HRA) Generator
--
-- Every tool is also a row in `courses` (kind='product') so the existing admin
-- panel manages its price / copy / publish state. These tables hold the tool
-- specific data: the templates, the purchased license keys, and (for qrmenu)
-- the hosted menus.
-- =========================================================================

-- Admin-managed template designs, shared by all tools. `data` is a per-tool
-- JSON payload (slide/element definitions, certificate layout, menu theme…).
CREATE TABLE IF NOT EXISTS tool_templates (
  id           BIGSERIAL PRIMARY KEY,
  product      TEXT NOT NULL,                 -- biodata | festival | certificate | idcard | qrmenu | rentreceipt
  slug         TEXT NOT NULL,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'general',
  description  TEXT,
  data         JSONB NOT NULL,
  dimensions   JSONB NOT NULL DEFAULT '{"width":1080,"height":1350}',
  is_free      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product, slug)
);

CREATE INDEX IF NOT EXISTS idx_tool_templates_product ON tool_templates(product);
CREATE INDEX IF NOT EXISTS idx_tool_templates_active ON tool_templates(product, is_active);

-- One-time purchase license keys. Scoped per product so a biodata key cannot
-- unlock the certificate tool.
CREATE TABLE IF NOT EXISTS tool_licenses (
  id           BIGSERIAL PRIMARY KEY,
  product      TEXT NOT NULL,
  license_key  TEXT UNIQUE NOT NULL,
  buyer_email  TEXT NOT NULL,
  order_id     TEXT REFERENCES orders(order_id),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_licenses_email ON tool_licenses(product, buyer_email);
CREATE INDEX IF NOT EXISTS idx_tool_licenses_key ON tool_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_tool_licenses_order ON tool_licenses(order_id);

-- Hosted QR menus. A shop owner publishes a menu; customers scan the QR to open
-- /m/:public_id which renders this JSON.
CREATE TABLE IF NOT EXISTS qr_menus (
  id           BIGSERIAL PRIMARY KEY,
  public_id    TEXT UNIQUE NOT NULL,
  edit_token   TEXT NOT NULL,               -- secret returned to the owner so they can re-publish
  license_key  TEXT,
  buyer_email  TEXT,
  shop_name    TEXT NOT NULL DEFAULT 'My Shop',
  data         JSONB NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  view_count   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_menus_public ON qr_menus(public_id);
CREATE INDEX IF NOT EXISTS idx_qr_menus_email ON qr_menus(buyer_email);

INSERT INTO schema_migrations (version) VALUES ('009_tools')
ON CONFLICT (version) DO NOTHING;
