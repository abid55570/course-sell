# DropDash

A digital-product platform with two product lines and one automated checkout:

1. **Invite Video Maker** — buyers customise a template (names, dates, photos, colours, their own text), preview it live, pay, and receive an HD + WhatsApp-ready video rendered on the server.
2. **Courses** — a course store with PDF / Google-Drive delivery and automated confirmation emails.

All payments go through **Razorpay** (UPI, cards, netbanking, wallets) — courses *and* videos. There is no manual UPI/UTR flow.

---

## Features

### Invite video generator
- **16 templates** across 10 occasions (weddings, engagement, save-the-date, anniversary, birthday, baby shower, griha pravesh, new year, festivals, business), using 4 render engines (`elegant_wedding`, `greeting`, `birthday`, `classic`).
- **Buyer customisation**: 13 colour palettes + custom accent/background colours, 4 frame/border styles, add-your-own text lines, and up to 5 photos (Ken Burns slideshow behind the text).
- **Live preview** in the editor that mirrors the final render, watermarked until paid.
- **Server-side render** via bundled `ffmpeg-static` (no system ffmpeg required) → clean HD MP4 + a <16 MB WhatsApp variant.
- **Payment-gated download** — the clean file is rendered only after payment and served only through an authorised, unguessable link kept outside the public web root.
- **Plan ladder** (Basic / Standard / Premium): the buyer picks a plan per template; higher plans unlock longer video, more photos, higher resolution, and free revisions. Plan prices come from env, so occasion pricing changes without code edits.

### Courses
- Admin-managed courses with binary (BYTEA) thumbnails, PDF upload, Drive links, per-course email visibility flags, and optional custom confirmation-email HTML.
- PDF / Drive delivery unlocked automatically on payment; PDF download gated by order status **and** the per-course flag.

### Payments — Razorpay (courses and videos)
- `POST /api/orders` → creates a local order + a Razorpay order.
- Razorpay Checkout in the browser → `POST /api/orders/:id/verify` (HMAC signature check).
- `POST /api/payments/webhook` (signature-verified) is the reliable server-to-server fallback.
- Both converge on one **idempotent** fulfilment step (course email OR enqueue video render).
- **Dev-bypass**: with no Razorpay keys set, checkout auto-completes so you can click through locally.

### Admin (`/admin`)
- Overview stats · Courses CRUD · **Video Templates** CRUD (+ categories, render-queue, re-render) · Orders (auto-completed by Razorpay, with a manual confirm override) · Transactions audit log.

---

## Stack

- **Node.js + Express** (no frontend build step)
- **PostgreSQL** — versioned SQL migrations, BYTEA thumbnails, JSONB for template/field/style data
- **ffmpeg-static** + bundled OFL fonts (Great Vibes, Cinzel, Noto Sans) for rendering
- **Razorpay** payments · **Nodemailer** email · **node:test** runner
- **Docker Compose** available for Postgres (and the full app)

---

## Local setup

**Prerequisites:** Node.js 18+ and a PostgreSQL database. No system ffmpeg needed — it's bundled.

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
#   Edit .env — at minimum DATABASE_URL and JWT_SECRET.
#   Leave RAZORPAY_* blank for local dev-bypass checkout.

# 3. Database  (need Postgres? start just the db service: `docker compose up -d db`)
npm run migrate         # apply migrations 001–005
npm run seed:video      # 16 templates + 10 categories
npm run seed:demo       # (optional) sample courses
npm run init-admin      # create admin from ADMIN_EMAIL / ADMIN_PASSWORD

# 4. Run
npm run dev             # http://localhost:3000  (nodemon)   — or: npm start
```

Open:
- `/` landing · `/generator` invite maker · `/admin` admin panel

> **Database note:** point `DATABASE_URL` at a **single primary** Postgres. A connection endpoint that load-balances across replicas (each connection hitting a different node) will show inconsistent data and break the per-session schema used by the e2e tests.

### Key environment variables

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (single primary). |
| `JWT_SECRET` | Admin session signing (≥32 chars). |
| `SITE_NAME` / `SITE_URL` | Brand name + public base URL (used in emails/webhook). |
| `RAZORPAY_KEY_ID` / `_KEY_SECRET` | Razorpay API keys. Blank = dev-bypass. |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature secret. |
| `SMTP_*`, `SUPPORT_EMAIL` | Email delivery. Blank SMTP = emails logged, not sent. |
| `RENDER_CONCURRENCY` | Videos rendered at once (CPU-bound; default 1). |
| **`VIDEO_PRICE_LOW/MID/HIGH`** | **Final (discounted) price per tier — e.g. 699 / 999 / 1299.** |
| **`VIDEO_DISCOUNT_PERCENT`** | **Headline discount, e.g. 70 → "70% OFF"; the "was" price is derived.** |

### Plans & changing prices per occasion

Every template is sold on a **3-plan ladder** the buyer chooses in the editor:

| Plan | Price env | Length | Photos | Resolution | Free revisions |
|---|---|---|---|---|---|
| Basic | `VIDEO_PRICE_LOW` | 15s | 1 | 720p HD | — |
| Standard | `VIDEO_PRICE_MID` | 25s | 3 | 1080p Full HD | 1 |
| Premium | `VIDEO_PRICE_HIGH` | 40s | 5 | 1080p Full HD | 2 + priority |

The chosen plan drives the **order amount** and the **render** (length, photo cap, output resolution). A template's `price_tier` (`low`/`mid`/`high`) is just the plan **pre-selected** in the editor (weddings default to Premium, greetings to Basic); the buyer can pick any plan. Gallery cards show a "from" (Basic) price.

To run a sale, edit the plan prices in `.env` — buyer-facing prices update on **restart**:

```env
VIDEO_PRICE_LOW=599     # Basic
VIDEO_PRICE_MID=899     # Standard
VIDEO_PRICE_HIGH=1199   # Premium
VIDEO_DISCOUNT_PERCENT=75
```

The strike-through "was" price is derived so the discount is exact: `was = round(price / (1 − percent/100))` — e.g. `999` at `70%` → **₹999** ~~₹3,330~~ **70% OFF**. The plan **features** (length/photos/resolution/revisions) are product constants in `services/pricing.js`; run `npm run seed:video` after changing env to refresh admin-stored values.

---

## Run with Docker

Bring up Postgres + the app together:

```bash
cp .env.example .env
docker compose up --build -d
docker compose logs -f app
docker compose exec app npm run seed:video   # seed templates
HOST_PORT=8080 docker compose up -d           # override host port
```

For **production** deployment with PM2 + Nginx, see [deployment.md](deployment.md).

---

## Scripts

| Command | What it does |
|---|---|
| `npm start` / `npm run dev` | Run the server (dev = nodemon). |
| `npm run migrate` | Apply pending SQL migrations. |
| `npm run seed:video` | Seed/refresh video categories + templates (also refreshes tier prices). |
| `npm run seed:demo` | Seed sample courses. |
| `npm run init-admin` | Create the admin user. |
| `npm test` | Unit + e2e (`node --test`). |
| `npm run test:unit` | Unit tests only (no DB). |
| `npm run test:e2e` | E2E tests (needs `TEST_DATABASE_URL` / `DATABASE_URL`). |

---

## Project structure

```
server.js                 Express app + route wiring
routes/                   auth, courses, orders, video, admin, admin-video, payments (webhook)
services/                 payments (razorpay), pricing (tiers), renderer (ffmpeg),
                          render-queue, fulfillment, video-templates (catalog), storage
utils/                    db (pg), email, video-fields (validation), discount, slug, template
migrations/               001_init … 005_price_tier
public/                   landing, generator (gallery + editor), checkout, order, admin, css, js
assets/fonts/             bundled OFL fonts used by the renderer
storage/                  rendered videos + buyer photos (NOT web-served; payment-gated)
docs/                     plan + implementation notes
```

---

## Testing

```bash
npm run test:unit                                   # fast, no DB
TEST_DATABASE_URL=postgres://... npm run test:e2e   # ephemeral schema per test
```

E2E covers admin auth, the course Razorpay flow, and the full video pipeline (template → project → gated 403 → pay → render → MP4 download). The harness creates a temporary schema per test, so point it at a **single consistent primary**.

---

## Email (Gmail SMTP)

1. Enable 2-step verification on your Google account.
2. Create an App Password (myaccount.google.com/apppasswords → "Mail").
3. Put the 16-char password in `SMTP_PASS`, and your Gmail in `SMTP_USER`.

With SMTP blank/invalid, `sendMail` returns `{ skipped: true, … }` and logs the would-be email — handy for local dev and tests.

---

## Security notes

- bcrypt-hashed admin passwords; HTTP-only JWT cookie; rate limiting on login.
- Razorpay checkout + webhook signatures verified (HMAC); fulfilment is idempotent.
- Rendered videos + buyer photos live **outside** the public web root and are served only through payment-gated endpoints.
- Uploads restricted by type/size. Replace `JWT_SECRET` with a long random value before deploying, and set real `RAZORPAY_*` keys in production.
