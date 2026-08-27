-- =========================================================================
-- Delivery fields for the storefront catalog.
--
-- Migration 011 gave catalog_products everything needed to *sell* a product
-- and nothing needed to *deliver* one. A paid catalog order therefore always
-- fell through to the "your download is not ready yet" email, no matter what
-- an admin uploaded — there was nowhere to record the file.
--
-- These mirror the columns `courses` already carries, so the delivery email
-- and the gated download route can treat both product lines the same way.
--
-- Both send_* flags default FALSE, not TRUE: a row with no file must never
-- claim a download. They turn on when an admin attaches something.
-- =========================================================================

ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS pdf_file            TEXT;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS drive_link          TEXT;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS send_pdf_in_email   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS send_drive_in_email BOOLEAN NOT NULL DEFAULT FALSE;

-- Finding the products that still cannot be delivered is the single most
-- common operational question here, so it gets an index rather than a scan.
CREATE INDEX IF NOT EXISTS idx_catalog_deliverable
  ON catalog_products(kind)
  WHERE pdf_file IS NOT NULL OR drive_link IS NOT NULL;

INSERT INTO schema_migrations (version) VALUES ('012_catalog_delivery')
ON CONFLICT (version) DO NOTHING;
