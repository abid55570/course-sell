-- =========================================================================
-- Video invite generator + Razorpay automated payments.
--   * video_categories / video_templates / video_projects
--   * orders extended to carry either a course OR a video project, plus
--     Razorpay identifiers (razorpay is now the only automated payment path)
-- =========================================================================

-- ----- video categories ---------------------------------------------------
CREATE TABLE IF NOT EXISTS video_categories (
  id           BIGSERIAL PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  icon         TEXT,
  sort_order   INT NOT NULL DEFAULT 0,
  publish_from DATE,
  publish_to   DATE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----- video templates ----------------------------------------------------
CREATE TABLE IF NOT EXISTS video_templates (
  id                 BIGSERIAL PRIMARY KEY,
  slug               TEXT UNIQUE NOT NULL,
  name               TEXT NOT NULL,
  category_id        BIGINT REFERENCES video_categories(id) ON DELETE SET NULL,
  composition_id     TEXT NOT NULL,
  preset             JSONB,
  aspect_ratios      TEXT[] NOT NULL DEFAULT '{9:16}',
  duration_seconds   INT NOT NULL DEFAULT 20,
  language_options   TEXT[] NOT NULL DEFAULT '{en}',
  fields_schema      JSONB NOT NULL,
  music_options      JSONB,
  preview_video_url  TEXT,
  thumbnail_data     BYTEA,
  thumbnail_mime     TEXT,
  original_price     NUMERIC(12,2) NOT NULL DEFAULT 0,
  discounted_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_published       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order         INT NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vtpl_slug ON video_templates(slug);
CREATE INDEX IF NOT EXISTS idx_vtpl_category ON video_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_vtpl_published ON video_templates(is_published);

-- ----- video projects (one buyer customization) ---------------------------
CREATE TABLE IF NOT EXISTS video_projects (
  id             BIGSERIAL PRIMARY KEY,
  public_id      TEXT UNIQUE NOT NULL,
  template_id    BIGINT NOT NULL REFERENCES video_templates(id) ON DELETE CASCADE,
  order_id       TEXT,
  buyer_email    TEXT,
  form_data      JSONB NOT NULL DEFAULT '{}',
  photos         JSONB,
  music_choice   TEXT,
  language       TEXT NOT NULL DEFAULT 'en',
  aspect_ratio   TEXT NOT NULL DEFAULT '9:16',
  render_status  TEXT NOT NULL DEFAULT 'draft'
                 CHECK (render_status IN ('draft','queued','rendering','done','failed')),
  output_file    TEXT,
  wa_file        TEXT,
  output_size_mb NUMERIC(6,2),
  revisions_used INT NOT NULL DEFAULT 0,
  render_error   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vp_order ON video_projects(order_id);
CREATE INDEX IF NOT EXISTS idx_vp_status ON video_projects(render_status);
CREATE INDEX IF NOT EXISTS idx_vp_template ON video_projects(template_id);

-- ----- extend orders ------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'course';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS video_project_id BIGINT REFERENCES video_projects(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- A video order has no course, so course_id must be allowed to be null.
ALTER TABLE orders ALTER COLUMN course_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_rzp ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_ptype ON orders(product_type);

-- Guard: every order references exactly one product kind.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_product_ref_chk') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_product_ref_chk
      CHECK (course_id IS NOT NULL OR video_project_id IS NOT NULL);
  END IF;
END$$;

INSERT INTO schema_migrations (version) VALUES ('003_video_generator')
ON CONFLICT (version) DO NOTHING;
