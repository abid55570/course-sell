-- =========================================================================
-- Store catalog shape. Both product lines live in `courses`, separated by
-- `kind`: 'ebook' (Rapid-Revision) and 'promptpack' (PromptKart). Legacy
-- 'course' and 'product' stay valid so existing rows and orders resolve.
-- =========================================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS board        TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS class_level  TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS subject      TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS exam_date    DATE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS page_count   INT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sample_pdf   TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS language_mix TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS accent_color TEXT;

CREATE INDEX IF NOT EXISTS idx_courses_class_subject ON courses(class_level, subject);

CREATE TABLE IF NOT EXISTS course_chapters (
  id        BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position  INT NOT NULL,
  title     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chapters_course ON course_chapters(course_id, position);

CREATE TABLE IF NOT EXISTS course_faqs (
  id        BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position  INT NOT NULL,
  question  TEXT NOT NULL,
  answer    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_faqs_course ON course_faqs(course_id, position);

CREATE TABLE IF NOT EXISTS leads (
  id         BIGSERIAL PRIMARY KEY,
  email      TEXT,
  whatsapp   TEXT,
  course_id  BIGINT REFERENCES courses(id) ON DELETE SET NULL,
  source     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

INSERT INTO schema_migrations (version) VALUES ('010_store_catalog')
ON CONFLICT (version) DO NOTHING;
