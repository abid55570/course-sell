-- Payment and email fulfilment are independent. Historical orders are not
-- backfilled: their delivery is unknown and must not trigger mass resends.
CREATE TABLE IF NOT EXISTS order_email_deliveries (
  order_id TEXT PRIMARY KEY REFERENCES orders(order_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'failed', 'delivered')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  claim_token TEXT,
  last_error TEXT,
  message_id TEXT,
  delivered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON COLUMN order_email_deliveries.delivered_at IS
  'Time SMTP accepted the buyer recipient; not proof of inbox placement or reading';
CREATE INDEX IF NOT EXISTS idx_email_delivery_due
  ON order_email_deliveries(next_attempt_at) WHERE status <> 'delivered';
INSERT INTO schema_migrations(version) VALUES ('013_email_delivery')
ON CONFLICT(version) DO NOTHING;
