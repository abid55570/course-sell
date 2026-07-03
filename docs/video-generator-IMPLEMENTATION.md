# Invite Video Generator — Implementation Notes

What was actually built into `course-platform`, and how to run it. This is the
working Phase-0/1 slice from [wedding-video-generator-plan.md](wedding-video-generator-plan.md),
with **Razorpay as the single automated payment path** (no manual UPI/UTR).

## What's included

- **Razorpay payments for everything** (courses *and* videos). The old manual
  UPI-QR + UTR-submit flow is removed. Buyers pay in Razorpay Checkout; the order
  auto-completes via checkout-signature verification **and** a server webhook
  (belt-and-suspenders). Falls back to a local **dev-bypass** when no keys are set.
- **Video generator**: template catalog by category, a data-driven customization
  form with a **live watermarked preview**, order + pay, then an **ffmpeg render**
  (bundled binary — no system install), and a **payment-gated download** (HD +
  WhatsApp-optimized variant).
- **6 seed templates** across wedding / new-year / festival / birthday, using 3
  render compositions (`elegant_wedding`, `greeting`, `birthday`).

## New / changed files

| File | Purpose |
|---|---|
| `migrations/003_video_generator.sql` | video_categories, video_templates, video_projects; orders gains product_type + razorpay ids; course_id nullable |
| `services/payments.js` | Razorpay order creation + checkout/webhook signature verification (unit-tested) |
| `services/video-templates.js` | Built-in catalog + render-model mappers keyed by composition_id |
| `services/renderer.js` | ffmpeg-static renderer (bundled OFL fonts) → HD + WhatsApp mp4 |
| `services/render-queue.js` | In-process render queue with restart recovery |
| `services/fulfillment.js` | Idempotent `markOrderPaid` (course email OR enqueue render) — shared by verify + webhook |
| `services/storage.js` | Non-public storage dirs for gated media |
| `utils/video-fields.js` | Field validation/sanitization (unit-tested) |
| `routes/video.js` | Public: catalog, projects, preview, gated download |
| `routes/admin-video.js` | Admin: template/category CRUD, render queue, re-render |
| `routes/payments.js` | Razorpay webhook |
| `routes/orders.js` | **Rewritten** for Razorpay (create + verify), both product types |
| `public/generator.html`, `generator-edit.html`, `js/generator.js` | Gallery + editor + live preview |
| `public/js/checkout-lib.js` | Shared Razorpay checkout helper |
| `public/checkout.html`, `js/app.js` | Course checkout switched to Razorpay; order page polls video render |
| `assets/fonts/*` | Great Vibes, Cinzel, Noto Sans (all SIL OFL) |
| `tests/unit/payments.test.js`, `video-fields.test.js` | 14 unit tests |
| `tests/e2e/api.test.js` | Updated to Razorpay flow + full video pipeline test |

## Run it

```bash
# 1. env
cp .env.example .env          # set DATABASE_URL, JWT_SECRET, SMTP_*, and (for live) RAZORPAY_*

# 2. db
npm run migrate               # applies 001,002,003
npm run seed:video            # loads categories + 6 templates
npm run init-admin            # admin login

# 3. go
npm run dev                   # http://localhost:3000/generator
```

**Payments:** leave `RAZORPAY_*` blank for local dev — checkout auto-completes
("dev bypass") so you can click through end to end. For production set
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and add a webhook at
`{SITE_URL}/api/payments/webhook` (events: `payment.captured`, `order.paid`)
with its secret in `RAZORPAY_WEBHOOK_SECRET`.

## The flow

```
/generator (gallery) → /generator/:slug (form + live preview) → Pay (Razorpay)
  → POST /api/video/projects (validate+save)  → POST /api/orders (video)
  → verify signature (+ webhook)  → fulfilment enqueues render
  → render-queue: ffmpeg → HD + WA mp4  → email "video ready"
  → /order/:id polls, shows Download HD / Download for WhatsApp (gated)
```

## Renderer scope and upgrade path

The bundled renderer produces an **elegant animated invite** (gold border,
script/serif fonts, staggered fades) — verified to output valid 1080×1920 H.264
mp4s. It now supports:

- **Photo Ken Burns slideshow** behind the text: up to 5 buyer photos, each
  slow-zoomed and cross-faded, under a dark scrim so the text stays readable.
  Buyers add photos in the editor (`#photoInput`); they're held client-side and
  uploaded to the project at pay time, then the render-queue passes them to
  `renderProject({ photos })`. Verified with a real 3-photo render.

Licensed music and multiple aspect ratios are wired in the schema/options but
not yet in the render graph. The renderer stays pluggable: swap
`services/renderer.js` for a Remotion/After-Effects pipeline later without
touching routes, queue, or payments.

## Admin dashboard

The admin dashboard (`/admin/dashboard`) has a **Video Templates** tab:
list / create / edit / delete templates and add categories. The template modal
picks a composition + palette + heading, sets duration and 3-tier prices, and
edits the buyer field schema as JSON (pre-filled from the composition). Orders
tab now shows video orders too (product type + render status + Razorpay payment id).

## Tests

- `npm run test:unit` — 14 pass (Razorpay signatures, field validation) + existing.
- `npm run test:e2e` — needs Postgres (`TEST_DATABASE_URL`); covers admin, course
  Razorpay flow, and the full video pipeline (template → project → gated 403 →
  pay → render → 200 mp4 download).

## Known caveats

- **Licensed music only** when you add audio — no copyrighted tracks.
- Renders run **in-process**; move to BullMQ + a worker when volume grows.
- `qrcode` dependency is now unused (kept to avoid churn); remove when convenient.
