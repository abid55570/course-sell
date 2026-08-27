-- =========================================================================
-- Storefront catalog. Replaces web/lib/catalog/*.ts as the source of truth
-- for the products and bundles the storefront renders. Queryable fields are
-- real columns; the nested content a product page renders as a whole
-- (modules, sections, FAQs, gallery, helplines) lives in one JSONB blob,
-- because nothing ever filters inside it.
--
-- Products and bundles share this table, separated by `kind`. Their shared
-- fields dominate, and one table means one accessor path in the storefront
-- and one foreign key for `orders` to point at.
-- =========================================================================

CREATE TABLE IF NOT EXISTS catalog_products (
  id              BIGSERIAL PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  kind            TEXT NOT NULL DEFAULT 'product'
                  CHECK (kind IN ('product','bundle')),
  title           TEXT NOT NULL,
  short_title     TEXT,
  tagline         TEXT NOT NULL,
  price           NUMERIC(10,2) NOT NULL,
  anchor_price    NUMERIC(10,2),
  category_slug   TEXT,
  category_label  TEXT,
  accent_name     TEXT,
  accent_hex      TEXT,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  featured        BOOLEAN NOT NULL DEFAULT FALSE,
  available_today BOOLEAN NOT NULL DEFAULT TRUE,
  pair_slug       TEXT,
  set_slug        TEXT,
  content         JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_slug ON catalog_products(slug);
CREATE INDEX IF NOT EXISTS idx_catalog_kind_published ON catalog_products(kind, is_published);
CREATE INDEX IF NOT EXISTS idx_catalog_category ON catalog_products(category_slug);

-- ----- orders can now reference a catalog product ------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS catalog_product_id
  BIGINT REFERENCES catalog_products(id);
CREATE INDEX IF NOT EXISTS idx_orders_catalog_product ON orders(catalog_product_id);

-- Migration 003 added orders_product_ref_chk as "course_id OR
-- video_project_id". Adding a third reference column means replacing that
-- constraint, not extending it. While replacing it, tighten "at least one"
-- to "exactly one": an order pointing at two products has no defined price
-- and no defined fulfilment path.
--
-- Refuse to tighten silently over data that would violate it. A migration
-- that drops a guard and then fails to re-add it leaves the table
-- permanently unguarded, so this raises instead, naming the offending
-- orders so they can be fixed by hand.
DO $$
DECLARE
  bad TEXT;
BEGIN
  SELECT string_agg(order_id, ', ') INTO bad
  FROM orders
  WHERE (course_id IS NOT NULL)::int
      + (video_project_id IS NOT NULL)::int
      + (catalog_product_id IS NOT NULL)::int <> 1;

  IF bad IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot tighten orders_product_ref_chk: these orders do not reference exactly one product: %', bad;
  END IF;

  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_ref_chk;
  ALTER TABLE orders ADD CONSTRAINT orders_product_ref_chk CHECK (
    (course_id IS NOT NULL)::int
  + (video_project_id IS NOT NULL)::int
  + (catalog_product_id IS NOT NULL)::int = 1
  );
END$$;

INSERT INTO schema_migrations (version) VALUES ('011_catalog_products')
ON CONFLICT (version) DO NOTHING;
