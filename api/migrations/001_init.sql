-- =========================================================================
-- Course Platform schema
-- Tracks: admins, courses (with thumbnails + email visibility flags),
-- orders, transactions (audit log), and support messages.
-- =========================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----- admins -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----- courses ------------------------------------------------------------
-- thumbnail and pdf_file hold relative URL paths to the file uploaded into
-- the persistent uploads volume (/app/public/uploads/...). The binary data
-- itself lives on disk; the row links it to the course.
CREATE TABLE IF NOT EXISTS courses (
  id                   BIGSERIAL PRIMARY KEY,
  slug                 TEXT UNIQUE NOT NULL,
  title                TEXT NOT NULL,
  short_description    TEXT,
  description          TEXT,
  thumbnail            TEXT,
  pdf_file             TEXT,
  drive_link           TEXT,
  original_price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  discounted_price     NUMERIC(12,2) NOT NULL DEFAULT 0,
  category             TEXT,
  level                TEXT,
  duration             TEXT,
  is_published         BOOLEAN NOT NULL DEFAULT TRUE,
  send_pdf_in_email    BOOLEAN NOT NULL DEFAULT TRUE,
  send_drive_in_email  BOOLEAN NOT NULL DEFAULT TRUE,
  email_template_html  TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);

-- ----- orders -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id            BIGSERIAL PRIMARY KEY,
  order_id      TEXT UNIQUE NOT NULL,
  course_id     BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  buyer_name    TEXT NOT NULL,
  buyer_email   TEXT NOT NULL,
  buyer_phone   TEXT,
  amount        NUMERIC(12,2) NOT NULL,
  upi_txn_ref   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','submitted','completed','cancelled')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_course ON orders(course_id);

-- ----- transactions (audit log) ------------------------------------------
-- Append-only log of every order state change, used by /api/admin/transactions.
CREATE TABLE IF NOT EXISTS transactions (
  id            BIGSERIAL PRIMARY KEY,
  order_id      TEXT NOT NULL,
  event         TEXT NOT NULL
                CHECK (event IN ('created','submitted','completed','cancelled','refunded','note')),
  actor         TEXT,
  amount        NUMERIC(12,2),
  upi_txn_ref   TEXT,
  detail        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tx_order ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_tx_event ON transactions(event);
CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(created_at DESC);

-- ----- support_messages (legacy, still readable from admin) --------------
CREATE TABLE IF NOT EXISTS support_messages (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  subject       TEXT,
  message       TEXT NOT NULL,
  is_resolved   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('001_init')
ON CONFLICT (version) DO NOTHING;
