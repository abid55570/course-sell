# Course Platform

Sell courses online with UPI payments, downloadable PDFs, Google Drive resources, automated confirmation emails via Gmail SMTP, an admin panel, an audit log of every order event, and a real PostgreSQL database that runs as its own Docker service.

## Stack

- **Node.js** + Express (no build step on the frontend)
- **PostgreSQL 16** — schema in versioned migration files, BYTEA storage for course thumbnails
- **Docker Compose** — `db` (postgres) + `app` (node) + optional `test` profile
- **node:test** — built-in test runner (no Jest), unit + E2E

## Features

- Public course listing, course detail, UPI checkout, order tracking
- UPI QR code per order, UTR submission, admin verification
- Per-course email visibility flags (`send_pdf_in_email`, `send_drive_in_email`) and an optional custom HTML template
- Append-only `transactions` audit table — every state change recorded with actor, amount, UPI ref, timestamp
- Course thumbnails stored as BYTEA in Postgres and served from `/api/courses/<slug>/thumbnail` with `Cache-Control: public, max-age=86400`
- Original price, discounted price, auto-calculated discount %
- PDF download gated by both order status (must be `completed`) and the per-course flag

## Database

Defined explicitly in [migrations/001_init.sql](migrations/001_init.sql) and [migrations/002_thumbnail_binary.sql](migrations/002_thumbnail_binary.sql). Tables:

| Table              | Purpose                                                                      |
| ------------------ | ---------------------------------------------------------------------------- |
| `admins`           | bcrypt-hashed admin users                                                    |
| `courses`          | course metadata + price + visibility flags + `thumbnail_data BYTEA`          |
| `orders`           | one row per buyer order, status checked by `CHECK` constraint                |
| `transactions`     | append-only audit log of order events (`created`/`submitted`/`completed`/…)  |
| `support_messages` | legacy table (public submission form was removed; admin can still read rows) |
| `schema_migrations`| applied migration versions, used by `scripts/migrate.js`                     |

Apply migrations with `npm run migrate` (the Docker `app` service runs them automatically on startup).

## Quick start (Docker — recommended)

Brings up Postgres + the app together. The `db` service is health-checked; the `app` waits until it reports healthy, then runs migrations and `init-admin` before starting.

```bash
cd course-platform
cp .env.example .env
# edit .env: ADMIN_PASSWORD, JWT_SECRET, UPI_ID, UPI_PAYEE_NAME, SMTP_USER, SMTP_PASS

docker compose up --build -d                   # build + start db + app
docker compose logs -f app                     # tail
docker compose exec app node scripts/seed-demo.js   # optional demo data
docker compose down                            # stop (data persists)
docker compose down -v                         # stop AND wipe volumes
```

Override the host port:

```bash
HOST_PORT=8080 docker compose up -d
```

Open http://localhost:3000, admin at `/admin`.

## Quick start (local Node)

You still need a Postgres somewhere. The fastest is to start just the `db` service from the compose file:

```bash
cd course-platform
cp .env.example .env

docker compose up -d db                # postgres on localhost:5432
npm install
npm run migrate                        # apply migrations
npm run init-admin                     # create admin user from .env
node scripts/seed-demo.js              # optional
npm start
```

## Tests

Unit tests (pure helpers and DB schema) and E2E tests (full HTTP flow against a real Express server, real Postgres, ephemeral schema per run).

```bash
npm test            # all 49 tests (unit + E2E)
npm run test:unit   # just unit
npm run test:e2e    # just E2E
```

Both suites need `DATABASE_URL` (or `TEST_DATABASE_URL`) pointing at a Postgres they can write to. They create a unique schema per test run and drop it at the end, so they don't interfere with the live `public` schema. Run them in Docker if you don't want to install Postgres locally:

```bash
docker compose --profile test run --rm test
```

### What the unit tests cover (`tests/unit/`)
- `discount.test.js` — discount % math, edge cases
- `slug.test.js` — slug generation, length cap, unicode
- `template.test.js` — placeholder rendering, HTML escaping, visibility flags, default-vs-custom template
- `db.test.js` — schema creation against ephemeral schema, BYTEA round-trip for thumbnails, status `CHECK` constraint, transaction logging

### What the E2E test covers (`tests/e2e/api.test.js`)
1. `/api/site-info`
2. Login fail (wrong password)
3. Login success, cookie set
4. `/api/auth/me`
5. **Create course with `send_pdf_in_email=false`, custom template, AND a binary PNG thumbnail** — assert `has_thumbnail: true` and `thumbnail: '/api/courses/<slug>/thumbnail'`
6. **Thumbnail endpoint streams the bytes back with `Content-Type: image/png`** (round-trip equality)
7. **Thumbnail endpoint 404 for unknown slug**
8. Public listing shows the course with `discount_percent: 75`
9. Anonymous order placement → UPI QR + `upi://pay?...` link
10. UTR submission
11. Order detail hides `drive_link` while status is `submitted`
12. Admin lists submitted order with the correct UTR
13. Admin confirms → email body contains buyer name + Drive link, **excludes PDF link** (visibility flag was off)
14. Order detail now exposes `drive_link` (status `completed`)
15. Audit log contains `created`, `submitted`, `completed` events
16. PDF download returns 403 (per-course flag is off)
17. Admin stats: `completed_orders=1`, `revenue=500`
18. Removed public `/api/support` route returns 404
19. Logout clears cookie

## Email templates

`utils/template.js#renderCompletedEmail` builds the confirmation email with these placeholders, all HTML-escaped except `{{resources_block}}`:

| Placeholder           | Meaning                                                       |
| --------------------- | ------------------------------------------------------------- |
| `{{buyer_name}}`      | Buyer's name                                                  |
| `{{buyer_email}}`     | Buyer's email                                                 |
| `{{course_title}}`    | Course title                                                  |
| `{{course_slug}}`     | Course slug                                                   |
| `{{order_id}}`        | Order reference                                               |
| `{{amount}}`          | Order amount                                                  |
| `{{drive_link}}`      | Drive URL (only if course has one and the flag is on)         |
| `{{pdf_url}}`         | Absolute PDF download URL (only if applicable)                |
| `{{resources_block}}` | Pre-rendered HTML `<ul>` of visible resources, raw            |

If the course's `email_template_html` field is empty, the platform uses `DEFAULT_COMPLETED_TEMPLATE`.

## Gmail SMTP setup

1. Enable 2-step verification on your Google account
2. https://myaccount.google.com/apppasswords → create an App Password for "Mail"
3. Put the 16-char app password in `SMTP_PASS` in `.env`. Set `SMTP_USER` to the same Gmail address.

When SMTP credentials are missing or invalid, `sendMail` returns `{ skipped: true, ... }` and logs the would-be email — handy for local development and the E2E test.

## UPI

Set `UPI_ID` to your VPA (e.g. `yourname@okhdfcbank`) and `UPI_PAYEE_NAME` to your name. The platform generates `upi://pay?...` deep links and a QR code per order. The customer pays, pastes the UTR back; you verify and confirm in the admin Orders tab; the system emails the access link.

## Security

- bcrypt-hashed admin passwords; HTTP-only cookie JWT
- File uploads restricted to PDF / images, 100 MB max
- Rate limiting on `/api/auth/login`
- PDFs only downloadable on confirmed orders, and only when the per-course `send_pdf_in_email` flag is on
- Thumbnail endpoint is public (intentional — thumbnails are marketing) but only returns bytes; no metadata leak
- `orders.status` enforced by a `CHECK` constraint
- Replace `JWT_SECRET` with a long random value before deploying

## Project layout

```
course-platform/
  server.js
  Dockerfile          production image (Alpine, non-root, healthcheck)
  Dockerfile.test     test-runner image
  docker-compose.yml  db (postgres) + app + optional test profile
  .dockerignore
  migrations/
    001_init.sql              admins, courses, orders, transactions, support
    002_thumbnail_binary.sql  thumbnail_data BYTEA + thumbnail_mime
  routes/      auth, courses, admin, orders
  middleware/  JWT auth
  utils/       db, email, discount, slug, template
  scripts/     migrate, init-admin, seed-demo
  tests/
    unit/      discount, slug, template, db
    e2e/       api  (+ helpers/start-server.js)
  public/      index, course, checkout, order, admin/login, admin/dashboard
    css/styles.css
    js/app.js, js/admin.js
    uploads/   pdfs (thumbnails now live in postgres)
```
