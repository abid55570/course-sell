-- =========================================================================
-- Let the courses table hold two kinds of sellable item: 'course' and
-- 'product' (a generic digital product). Delivery/checkout are identical, so
-- they share the same table + routes; only the storefront section differs.
-- =========================================================================

ALTER TABLE courses ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'course';
CREATE INDEX IF NOT EXISTS idx_courses_kind ON courses(kind);

INSERT INTO schema_migrations (version) VALUES ('007_course_kind')
ON CONFLICT (version) DO NOTHING;
