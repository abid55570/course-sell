# Drive-only email fulfilment

Implemented 10 September 2026 for `catalog` and legacy `course` orders.

## Behaviour

- `orders.status = completed` continues to mean payment confirmed. Existing payment verification, revenue and payment-provider logic rely on that meaning.
- `order_email_deliveries.status` records fulfilment separately: pending, sending, failed or delivered. `delivered_at` is set only after Nodemailer reports that SMTP accepted the buyer recipient. It is not an inbox-placement, read or bounce confirmation.
- Payment confirmation and durable queue insertion occur in one SQL statement. Email transport failure cannot erase a confirmed payment.
- The API worker checks the queue every 30 seconds. Retry delays are 1, 2, 4, 8, 16, 32 and 60 minutes, for up to 8 normal attempts. An interrupted sending job is recoverable after a 10-minute lease. Failed exhausted jobs remain visible for admin action.
- Admin Orders shows payment and email status separately. Retry email requeues paid, unsent course/catalog orders. It does not charge, bypass payment checks, or resend a recorded successful delivery.
- Historical completed orders have no delivery row and appear untracked. They are not automatically re-emailed. An administrator can deliberately retry one when investigating an undelivered order.
- The readiness script now checks enabled Drive links and migration 013 instead of requiring local PDF files. It does not prove Drive sharing permissions.
- Product emails use a controlled Drive-only template. They require an enabled HTTPS `drive.google.com` link. Legacy PDF flags and custom email HTML do not add download links to these emails.
- Both storefront and legacy order pages have no content download button. Public course and order responses do not expose Drive links or local file paths. Old order-PDF endpoints and public PDF-upload paths return 410.
- The separately implemented video and licensed-tool product lines retain their existing fulfilment behaviour.

## Activation

1. Apply database migration 013 before starting the changed API. The normal command from the repository root is `npm run migrate`; review outstanding migrations before using it against production.
2. In Catalogue, ensure every product being sold has its intended Google Drive link and **Send the Drive link** enabled. Check Drive permissions using a separate buyer account. A valid URL alone does not prove access.
3. Deploy/restart the API and rebuild/restart the Next storefront using the normal project deployment process. The worker starts with the API, not when its module is merely imported by a test.
4. Verify a staging order with an approved test mailbox: failed SMTP must show failed; restored SMTP plus Retry email must show delivered with a timestamp. Never run this test against a customer's address.
5. If a reverse proxy serves `/uploads/pdfs` directly from disk, remove that static mapping. The repository's documented Nginx configuration proxies `/uploads/` to Express, where it is blocked.

No production migration, restart, real email or customer-order mutation was performed during implementation. A read-only connection to the configured database timed out, so live Drive settings remain unverified.

## Delivery guarantees and limits

Claims use PostgreSQL locking and a per-attempt token to suppress normal concurrent duplicates. SMTP and PostgreSQL cannot share a transaction: a crash after SMTP acceptance but before recording the result can cause a retry to send a duplicate. This is at-least-once recovery, not a promise of exactly-once delivery. Recipient-provider delivery/bounce tracking would require a supported provider webhook or equivalent integration.

## Validation

- Backend unit suite: 152 passed, 13 database-dependent tests skipped (no test database configured).
- Seven order-view tests passed, covering catalog/course, queued, sending, failed, historical and email-only states.
- Embedded PostgreSQL verification applied migrations 001-013 and exercised atomic queue creation, failure/backoff, concurrent claims, delivery timestamp and repeat-call suppression. It used mocked email, not SMTP.
- App TypeScript check passed when excluding the unrelated cover-generation script; full checking is blocked by its missing `canvas` dependency.
- Full frontend suite: 607 passed, 84 failed across catalog, cover-fallback and phone-responsiveness suites. The same 84 failures were reproduced against an isolated copy of unchanged Git HEAD, confirming they predate this change.

The machine's default Node 20.11 cannot run the installed Vitest dependency stack. Verification used the bundled modern Node runtime and restored the exact missing `@rolldown/binding-win32-x64-msvc@1.2.4` optional dependency without changing manifests or lockfiles.
