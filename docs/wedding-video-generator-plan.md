# Wedding / Occasion Invite Video Generator — Full Build Plan

**Integrated into the existing `course-platform` (Express + Postgres + UPI + email).**
Version 1.0 · Scope: turn the course store into a self-serve personalized-video generator while reusing the orders/UPI/email/admin infrastructure you already have.

---

## 0. The one decision that shapes everything: payment automation

Your current flow is **manual**:

```
buyer creates order → gets UPI QR → pays in UPI app → submits txn reference
   → status = 'submitted' → YOU click "confirm" in admin → status = 'completed' → email + unlock
```

(See `routes/orders.js` for create/submit and `routes/admin.js:208` `/orders/:orderId/confirm`.)

For courses this is fine. For a video generator, the whole selling point is **"video in your WhatsApp in minutes."** Manual confirmation means the buyer waits for you to be awake at your laptop. Two ways to handle it:

| | Phase 1 — Manual (ship first) | Phase 2 — Automated (the real product) |
|---|---|---|
| Payment verify | You click confirm (existing) | Razorpay/Cashfree webhook auto-confirms |
| Delivery speed | Minutes-to-hours (depends on you) | Seconds, 24/7, no human |
| Build cost | Zero — already built | ~3–5 days to integrate a gateway |
| Good for | Launch, first 50 orders, proving templates | Scale, the "instant" promise, sleeping through sales |

**Recommendation:** Build Phase 1 first to prove the render pipeline and templates with real buyers, then add the automated gateway in Phase 3. The plan below is written so the render pipeline is identical either way — only the *trigger* (admin click vs webhook) changes.

---

## 1. How it reuses what you already have

You are **not** building a second app. ~60% of the backend already exists and gets reused as-is:

| Existing piece | Reused for the video generator |
|---|---|
| `orders` table + `POST /api/orders` | Creating a video order + generating the UPI QR (unchanged) |
| `POST /api/orders/:orderId/submit-txn` | Buyer submits UPI reference (unchanged) |
| `GET /api/orders/:orderId` | Order-status polling on the delivery page (extended to include render status) |
| `POST /api/admin/orders/:orderId/confirm` | Confirm → **branch**: if it's a video order, enqueue the render instead of emailing a PDF |
| `transactions` audit log | Same audit trail (created/submitted/completed) |
| `utils/email.js` (nodemailer) | Delivery email — new "your video is ready" template |
| `qrcode` + `buildUpiLink()` | Same UPI QR generation |
| Admin JWT auth (`middleware/auth.js`) | Same admin login guards new template/render endpoints |
| `utils/discount.js` | Coupons / anchor-price discounts on templates |
| `multer` upload pattern (`routes/admin.js`) | Buyer photo uploads + admin template-asset uploads |
| Postgres + `migrations/` pattern | Add `003_video_generator.sql` the same way |

**New pieces to build:** template catalog (data + gallery UI), the customization form with **live preview**, the **render engine + queue**, watermark-vs-clean gating, and (Phase 3) the payment gateway.

---

## 2. Rendering engine — use Remotion (why, and how it makes preview trivial)

**Recommendation: [Remotion](https://www.remotion.dev)** (React components → MP4 via headless Chrome + FFmpeg).

The killer reason is that **one template definition powers both the live preview and the final render**:

- **Browser preview:** `@remotion/player` renders the *same* React composition live as the user types. Zero server cost, instant, WYSIWYG — what they see is exactly what they'll get.
- **Final HD:** `@remotion/renderer` renders the *same* composition server-side to a clean MP4 after payment.

Adding a new template = adding one React component. You already have FFmpeg/React experience from the video-editor project, so this is squarely in your skill set.

**Alternative (lighter, less flexible):** pre-made base template videos (designed in After Effects) + FFmpeg overlay compositing for the personalized text/photos. Faster to render, but every template needs a video designer and preview is harder to keep WYSIWYG. Use this only if Remotion render times become a cost problem.

**Critical design choice — render the clean HD only *after* payment:**

```
Preview (free)  = Remotion Player in the browser, WATERMARKED, maybe reduced res  → costs you nothing
Final HD (paid) = server render triggered ONLY on payment confirm                 → you never burn CPU on non-buyers
```

This also solves anti-theft: the clean file literally does not exist on any server until money is confirmed.

---

## 3. Data model (migration `003_video_generator.sql`)

```sql
-- Categories (wedding, new-year, diwali, birthday, ...). A table (not an enum)
-- so you can add/schedule festival categories without a code deploy.
CREATE TABLE IF NOT EXISTS video_categories (
  id           BIGSERIAL PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  icon         TEXT,
  sort_order   INT NOT NULL DEFAULT 0,
  publish_from DATE,               -- optional: auto show/hide seasonal categories
  publish_to   DATE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE
);

-- Templates. `composition_id` maps to a Remotion component. `fields_schema`
-- is JSON describing which inputs this template asks the buyer for (so the
-- form is data-driven and you never hardcode a form per template).
CREATE TABLE IF NOT EXISTS video_templates (
  id                 BIGSERIAL PRIMARY KEY,
  slug               TEXT UNIQUE NOT NULL,
  name               TEXT NOT NULL,
  category_id        BIGINT REFERENCES video_categories(id) ON DELETE SET NULL,
  composition_id     TEXT NOT NULL,           -- Remotion composition name
  aspect_ratios      TEXT[] DEFAULT '{9:16}', -- portrait/square/landscape offered
  duration_seconds   INT NOT NULL DEFAULT 30,
  language_options   TEXT[] DEFAULT '{en,hi}',
  religion_style     TEXT,                    -- hindu/muslim/christian/sikh/neutral
  fields_schema      JSONB NOT NULL,          -- [{key,label,type,required,max,group}]
  music_options      JSONB,                   -- [{id,name,file,mood}] licensed tracks
  preview_video_url  TEXT,                    -- gallery loop preview
  thumbnail_data     BYTEA,                   -- reuse your inline-thumbnail pattern
  thumbnail_mime     TEXT,
  original_price     NUMERIC(12,2) NOT NULL DEFAULT 0,
  discounted_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_published       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order         INT NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One buyer customization = one project. Holds their form data + render state.
-- Links to an order via the existing orders table.
CREATE TABLE IF NOT EXISTS video_projects (
  id               BIGSERIAL PRIMARY KEY,
  public_id        TEXT UNIQUE NOT NULL,      -- unguessable id used in URLs
  template_id      BIGINT NOT NULL REFERENCES video_templates(id),
  order_id         TEXT REFERENCES orders(order_id),  -- null until they check out
  buyer_email      TEXT,
  form_data        JSONB NOT NULL,            -- the filled field values
  photos           JSONB,                     -- uploaded image paths
  music_choice     TEXT,
  language          TEXT DEFAULT 'en',
  aspect_ratio      TEXT DEFAULT '9:16',
  render_status    TEXT NOT NULL DEFAULT 'draft'
                   CHECK (render_status IN ('draft','queued','rendering','done','failed')),
  output_file      TEXT,                      -- clean HD (post-payment only)
  output_size_mb   NUMERIC(6,2),
  wa_file          TEXT,                      -- <16MB WhatsApp-optimized variant
  revisions_used   INT NOT NULL DEFAULT 0,
  render_error     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vp_order ON video_projects(order_id);
CREATE INDEX IF NOT EXISTS idx_vp_status ON video_projects(render_status);

-- Extend orders so one confirm handler can serve both product types.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'course';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS video_project_id BIGINT REFERENCES video_projects(id);
```

`orders.course_id` is currently `NOT NULL`. For video orders either (a) relax it to nullable, or (b) keep a single "video" placeholder course row. Cleanest is to make `course_id` nullable and add a `CHECK` that a row has *either* a course_id *or* a video_project_id.

---

## 4. End-to-end flow (the core UX)

```
1. Browse gallery  ──►  /generator  (categories + template cards with looping previews)
2. Pick template   ──►  /generator/:templateSlug  (customization form + LIVE preview)
3. Fill the form   ──►  Remotion Player preview updates live, WATERMARKED
4. "Get my video"  ──►  POST /api/video/projects        (saves form_data, returns public_id)
                        POST /api/orders {product_type:'video', video_project_id}
                        → returns UPI QR   (REUSES existing order+QR code)
5. Pay + submit    ──►  POST /api/orders/:orderId/submit-txn   (existing, unchanged)
6. Confirm         ──►  Phase 1: admin clicks confirm │ Phase 3: gateway webhook
                        → confirm handler sees product_type='video'
                        → sets order 'completed' + enqueues render (status 'queued')
7. Render worker   ──►  renders clean HD from form_data → 'done', stores output_file + wa_file
8. Deliver         ──►  "your video is ready" email with download link
                        /order/:orderId page flips to a download button
9. Download gate   ──►  GET /api/video/projects/:publicId/download
                        checks order.status='completed' AND render_status='done'
                        (watermarked preview NEVER serves the clean file)
```

The buyer can tweak and re-preview **freely before paying**. After payment the form locks, except **one free revision** for spelling fixes (keeps disputes/refunds down — the research flagged that reviews and disputes make-or-break this market).

---

## 5. Full feature list

### 5a. What the buyer fills in (data-driven per template via `fields_schema`)

**Wedding template fields:**
- Bride's name, Groom's name (or single celebrant for other occasions)
- "Son of / Daughter of" family names
- Wedding date + time
- Venue name + address + Google Maps link
- **Events sub-schedule** (repeatable): Mehndi / Haldi / Sangeet / Reception — each with date, time, venue
- Photo upload (1–5 images) with in-browser crop
- Custom message / blessing / shloka / quote
- Wedding hashtag (`#RahulWedsPriya`)
- RSVP / contact number
- Language: English / Hindi / regional (Marathi, Tamil, Telugu, Bengali, …)
- Music: pick from a **licensed** library, or mute
- Color theme / palette variant
- Religious motif: Hindu / Muslim / Christian / Sikh / neutral

**Field types supported:** text, textarea, date, time, phone, image-upload, select, color, repeatable-group. New templates just declare their fields in JSON — no new form code.

### 5b. Preview features
- **Live WYSIWYG preview** (Remotion Player) — updates as they type
- **Watermarked** + reduced resolution/length so it's useless to screen-record
- Play / pause / scrub timeline
- **Phone mock frame** (it's for WhatsApp — show it in a phone bezel)
- Aspect-ratio toggle (portrait 9:16 / square 1:1 / landscape 16:9)
- "Looks good? Unlock the HD version →" CTA under the preview

### 5c. Template catalog & categories
Start with **3 genuinely excellent templates per top category** (the research was explicit: 3 great beats 15 mediocre — one ugly template poisons word-of-mouth).

| Group | Categories |
|---|---|
| **Wedding & pre-wedding** | Wedding, Engagement / Roka, Save-the-Date, Sangeet/Mehndi invite, Anniversary |
| **Family occasions** | Birthday, Baby shower / Godh Bharai, Griha Pravesh (housewarming), Naming / Mundan, Retirement, Farewell |
| **Festivals** (seasonal, auto-scheduled) | Diwali, Holi, Raksha Bandhan, Ganesh Chaturthi, Navratri, Eid, Christmas, New Year, Pongal / Onam, Lohri / Baisakhi |
| **Business / corporate** | Festival greeting (logo-branded), Store opening, Product launch, Corporate wishes |
| **Generic** | Party invite, House party, Reunion |

Gallery filters: category, language, aspect ratio, religion/style, color. Seasonal categories auto show/hide via `publish_from`/`publish_to`.

### 5d. Delivery & the payment gate (your explicit requirement)
- **No clean download until payment is confirmed** — enforced at the API: the download endpoint checks `order.status='completed'` AND `render_status='done'`. Pre-payment there is only the watermarked in-browser preview; the clean file isn't rendered yet.
- HD MP4 (no watermark) download
- **WhatsApp-optimized <16MB** variant (auto-encoded)
- Multiple aspect ratios if the template offers them
- Email delivery with a re-download link (valid N days)
- Output URLs are **unguessable** (`public_id`) and auth-checked — not publicly listable

### 5e. Extra features to add (my additions — you asked me to fill gaps)
- **Watermark stamp** on all previews: brand + "PREVIEW — pay to unlock"
- **One free revision** post-render for typos (dispute-killer)
- **Draft save + resume link** by email → **abandoned-cart recovery** ("finish your invite")
- **3-tier / anchor pricing** (reuse `utils/discount.js`): entry static card ₹499 · HD video ₹1,199 · bundle ₹2,499 (video + card + save-the-date)
- **Add-ons at checkout:** extra revision, rush render, extra aspect ratio, remove-branding, extra photos
- **Coupons** (existing discount util) — first-order / festival codes
- **Licensed music library only** ⚠️ — never Bollywood/copyrighted tracks; use royalty-free or licensed catalog (real legal + WhatsApp-copyright risk)
- **Social-proof counter** ("2,431 invites delivered") once true
- **Optional RSVP mini-page** upsell: a hosted invite page with an RSVP button + guest list
- **Admin:** template CRUD, render-queue monitor, re-render button, failed-render alerts, refund
- **Analytics:** template popularity, form-completion → purchase conversion, render success rate, revenue by category
- **Auto-cleanup:** delete raw photo uploads + expired outputs on a retention schedule (storage cost control)
- **Content moderation** hook on uploaded photos (basic)

---

## 6. New API endpoints

```
Public
  GET  /api/video/categories                     list published categories
  GET  /api/video/templates?category=            gallery (public cols only)
  GET  /api/video/templates/:slug                one template + fields_schema
  GET  /api/video/templates/:slug/thumbnail      inline thumbnail (reuse pattern)
  POST /api/video/projects                        create/save a draft (form_data, photos)
  PUT  /api/video/projects/:publicId              update draft before checkout
  POST /api/video/projects/:publicId/photos       multer photo upload
  GET  /api/video/projects/:publicId/preview      preview render params (watermarked)
  GET  /api/video/projects/:publicId/status       render status for the delivery page
  GET  /api/video/projects/:publicId/download     GATED clean HD (status + render checks)

Checkout (REUSES existing)
  POST /api/orders                                {product_type:'video', video_project_id}
  POST /api/orders/:orderId/submit-txn            unchanged
  GET  /api/orders/:orderId                        extended with render status

Admin (JWT-guarded, reuse requireAdmin)
  GET/POST/PUT/DELETE /api/admin/video/templates      template CRUD
  GET/POST/PUT/DELETE /api/admin/video/categories     category CRUD
  POST /api/admin/video/projects/:id/rerender          re-render
  GET  /api/admin/video/queue                          render queue monitor
  POST /api/admin/orders/:orderId/confirm              extended: branch on product_type

Phase 3 (automation)
  POST /api/payments/webhook                           Razorpay/Cashfree → auto-confirm
```

---

## 7. File / folder structure (added to the repo)

```
course-platform/
├─ migrations/003_video_generator.sql
├─ routes/
│  ├─ video.js               # public template/project/preview/download
│  └─ admin-video.js         # admin template & category CRUD, queue
├─ services/
│  ├─ render-queue.js        # p-queue (MVP) → BullMQ later
│  ├─ renderer.js            # wraps @remotion/renderer, watermark, WA-encode
│  └─ storage.js             # disk now, S3/R2 adapter later
├─ remotion/                 # the video templates (React)
│  ├─ Root.tsx               # registers all compositions
│  ├─ templates/
│  │  ├─ WeddingClassic.tsx
│  │  ├─ WeddingRoyal.tsx
│  │  ├─ DiwaliGreeting.tsx
│  │  └─ ...
│  └─ shared/                # animated bits, fonts (Indic), motifs
├─ public/
│  ├─ generator.html         # gallery
│  ├─ generator-edit.html    # customization form + <Player> live preview
│  └─ js/generator.js
└─ public/uploads/
   ├─ video-assets/          # template base assets, music, fonts
   ├─ user-photos/           # buyer uploads (retention-cleaned)
   └─ renders/               # clean HD + WA variant (gated)
```

---

## 8. Dependencies to add

```jsonc
"remotion"              // core
"@remotion/player"      // browser live preview
"@remotion/renderer"    // server-side final render
"@remotion/bundler"     // bundle compositions for render
"sharp"                 // image processing / crop / resize
"p-queue"               // MVP render queue (→ bullmq + ioredis at scale)
// Phase 3:
"razorpay"              // OR cashfree-pg — automated payment + webhook
// Optional: "@aws-sdk/client-s3" for R2/S3 output storage + CDN
```

Remotion needs Chromium available in the environment (bundled via its renderer). On your Docker image add the headless-Chrome system deps — this is the one infra gotcha; budget half a day for it.

---

## 9. Phased roadmap

| Phase | Deliverable | Effort |
|---|---|---|
| **0 — Spike** | Migration + 1 hardcoded Remotion wedding template, form → live preview → order → **manual** confirm → render → email. Prove the pipeline end-to-end. | 4–6 days |
| **1 — MVP** | Template catalog + categories, gallery UI, data-driven form, watermark + download gate, 3 wedding templates, WhatsApp encode, admin template CRUD. | 1–2 weeks |
| **2 — Breadth** | Festival + New Year + birthday categories (3 each), music library, aspect ratios, add-ons, 3-tier pricing, coupons, draft-resume/abandoned-cart. | 1–2 weeks |
| **3 — Automate & scale** | Razorpay/Cashfree webhook → instant delivery, BullMQ render queue, S3/R2 + CDN output, analytics, one-free-revision, RSVP upsell. | 1–2 weeks |

Ship Phase 0→1 to start taking real orders, then layer 2 and 3.

---

## 10. Caveats / risks (don't skip these)

- **Music licensing** is a real legal risk — royalty-free/licensed tracks only, never copyrighted songs. WhatsApp/Meta and labels do act on this.
- **Font licensing** for Indic scripts — use open-licensed fonts (Noto, Google Fonts) so rendered output is clean of licensing issues.
- **Render cost & time** — every paid render is CPU/GPU minutes. Rendering only post-payment (per this plan) keeps that bounded; watch it as volume grows and cache/queue accordingly.
- **Storage growth** — outputs + user photos balloon; the retention-cleanup job is not optional.
- **Manual-confirm bottleneck** (Phase 1) — you are the payment processor until Phase 3. Fine for the first ~50 orders; automate before it becomes a support fire.
- **Quality over quantity** — 3 excellent templates, not 15 mediocre ones. One bad render is negative word-of-mouth in a 90%-review-driven market.
```
