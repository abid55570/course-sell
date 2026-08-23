# Dropdesk Store — Design Spec

**Date:** 2026-08-18
**Status:** Awaiting review
**Scope:** Rebuild dropdesk.in as a digital-products store for the Rapid-Revision ebook line and PromptKart.

---

## 1. What we are building

A fast, bright, mobile-first storefront that turns Instagram traffic into paid PDF downloads.

Dropdesk sells two lines:

| Line | Product | Price | Buyer |
|---|---|---|---|
| Rapid-Revision | 20-page exam-revision PDF, one subject per book | ₹49–99 single, ₹199–299 bundle | CBSE/UP Board Class 9–12 students, SSC CGL aspirants, and the parents paying |
| PromptKart | DALL·E 3 prompt packs | ₹199 single, ₹999 bundle, ₹1,999 vault | Creators making carousels and thumbnails |

### The one fact that drives every decision

Traffic arrives from a reel. The path is: reel → comment "REVISE" → Whatly DM → link in bio → this site → pay.

So the visitor is on a mid-range Android phone, on Indian mobile data, four seconds after seeing a panic hook, deciding whether to spend ₹49. Every design choice below serves that person. Anything that slows the page down costs money directly.

### Out of scope

The six creator tools (biodata, festival poster, certificate, ID card, QR menu, rent receipt), the invite-video generator and the carousel editor are **not part of the new site**. Their Express routes, licence checks and URLs stay live so existing customers keep access. They are removed from navigation, not from the codebase.

---

## 2. Architecture

```
c:\Dropdesk\
├── api/                     Express, port 4000, /api/* only
│   ├── routes/ services/ middleware/ migrations/
│   └── server.js            Razorpay, auth, email, storage, admin — unchanged
├── web/                     Next.js App Router, port 3000
│   ├── app/
│   │   ├── page.tsx                 home
│   │   ├── revision/                ebook line
│   │   │   ├── page.tsx             browse by class
│   │   │   └── [class]/[subject]/   product page
│   │   ├── promptkart/
│   │   │   ├── page.tsx             pack listing
│   │   │   └── [pack]/              pack page
│   │   ├── checkout/  order/[id]/
│   │   └── api/revalidate/          cache busting on publish
│   ├── components/ui/       shadcn + KokonutUI
│   ├── lib/motion/          lenis, gsap, anime
│   └── components.json      includes @kokonutui registry
└── public/                  legacy pages, still served, unlinked
```

Express keeps every job it already does well: Razorpay orders and webhooks, JWT auth, nodemailer delivery, object storage, the admin API. Next.js never talks to Postgres directly. It fetches from Express over HTTP. One seam, easy to reason about, and no payment code gets rewritten.

**Rendering:** product and browse pages use static generation with on-demand revalidation, so a newly published ebook appears without a redeploy. Checkout and order pages render dynamically.

---

## 3. Design system

### Palette

Bright canvas so the dark ebook covers dominate the page. The covers are already locked to ink plus one vivid accent per subject (amber for Class 10 Maths, mint for Science, violet for Class 11 Science, gold for Commerce, navy and saffron for SSC). The site must not compete with them.

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#FFFFFF` | Page background |
| `--canvas-2` | `#F6F8FC` | Alternating sections, cards |
| `--ink` | `#0B1020` | Body text, headings |
| `--muted` | `#5A6480` | Secondary text |
| `--primary` | `#3B4EF0` | Buttons, links, brand |
| `--urgent` | `#FF5A1F` | Countdowns, days-left, deadline pressure |
| `--proof` | `#12B981` | Ticks, verified facts, delivery confirmations |

`--urgent` is reserved. It appears only on real deadline information, never as decoration. If everything is urgent, nothing is.

### Type

- Display: Big Shoulders, already in use on the thumbnails, which ties store and product together
- Body: Instrument Sans
- Numerals and labels: Geist Mono for day counts and page counts
- Devanagari: Noto Sans Devanagari, matching the ebook stack

Hindi and Hinglish are first-class. Headlines like "SIRF 30 DIN" render in the same weight and size as English, never as an afterthought.

### Motion

| Library | Job | Loaded |
|---|---|---|
| Lenis | Smooth scroll, single scroll source of truth | Always, ~3KB |
| GSAP + ScrollTrigger | Section reveals, countdown emphasis, pinned proof strip | Always, homepage and product pages |
| anime.js v4 | Counters, badges, add-to-cart feedback | Per component, tree-shaken |
| Three.js | One homepage hero object | Desktop only, lazy, after hero is interactive |

Three.js is fenced so it cannot hurt the numbers below. It never loads on mobile, never loads under `prefers-reduced-motion`, and never blocks the hero. Mobile gets a CSS gradient built to look intentional rather than degraded.

Every animation respects `prefers-reduced-motion`. Motion emphasises real information, such as a countdown crossing into single digits, rather than decorating the page.

### Performance budget, enforced in CI

- Homepage first load: under 180KB JS. Three.js sits outside this number because it loads lazily on desktop only, after the hero is interactive. It must never enter the critical path.
- LCP under 2.5s on throttled 4G, Moto G class device
- CLS under 0.1
- No layout shift from the countdown

A build that breaks these fails.

---

## 4. Page designs

### Home

The visitor knows nothing except the reel they just saw. Get them to the right shelf in one tap.

1. Hero: what Dropdesk sells, stated plainly, with the live countdown if a board exam is near
2. Two doors: Exam Revision and PromptKart
3. Best sellers, real ones only
4. How delivery works: pay by UPI, PDF in your email in seconds
5. Free sample chapter capture
6. FAQ

### Browse (`/revision`)

Class first, then subject, because that is how a student thinks. Class 9, 10, 11, 12, SSC. Each subject card shows the cover, price, page count and whether a free sample exists.

### Product page (`/revision/[class]/[subject]`)

The money page. Order:

1. Cover, price, buy button, all visible without scrolling on a 390px screen
2. The promise: revise the entire subject in one sitting, the night before the exam
3. Countdown: "Board exam in 23 days", driven by a real exam date in the database
4. What is inside: 20 pages, one page per chapter, the chapter list
5. Sample chapter, free, in exchange for email or WhatsApp
6. Delivery and refund terms
7. FAQ

The 20-page limit is the product, so the page argues compression as a feature rather than apologising for length.

### PromptKart pack page

Built on before/after output proof, since that is the stated moat. Every pack shows real generated images. Prompt count, categories, and the monthly-update policy each get a line.

---

## 5. Data model

New migration `010_store_catalog.sql`, extending the existing `courses` table rather than replacing it. It already carries `kind`, `pdf_file`, `drive_link` and `send_pdf_in_email`, so delivery works today.

Both product lines live in `courses`, separated by `kind`: `ebook` for Rapid-Revision, `promptpack` for PromptKart. The legacy values `course` and `product` stay valid so existing rows and orders keep resolving. Checkout, licensing and email delivery stay identical across all four, which is what makes adding a third line later a data change rather than a build.

```sql
ALTER TABLE courses ADD COLUMN IF NOT EXISTS board          TEXT;      -- CBSE, UP Board, SSC
ALTER TABLE courses ADD COLUMN IF NOT EXISTS class_level    TEXT;      -- 9, 10, 11, 12, ssc-cgl
ALTER TABLE courses ADD COLUMN IF NOT EXISTS subject        TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS exam_date      DATE;      -- drives the countdown
ALTER TABLE courses ADD COLUMN IF NOT EXISTS page_count     INT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sample_pdf     TEXT;      -- free chapter
ALTER TABLE courses ADD COLUMN IF NOT EXISTS language_mix   TEXT;      -- en, hi, hinglish
ALTER TABLE courses ADD COLUMN IF NOT EXISTS accent_color   TEXT;      -- matches the cover theme

CREATE TABLE IF NOT EXISTS course_chapters (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position INT NOT NULL,
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS course_faqs (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position INT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  email TEXT, whatsapp TEXT,
  course_id BIGINT REFERENCES courses(id),
  source TEXT,                    -- reel, dm, direct
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

`exam_date` powers the countdown from real data. No hardcoded dates, no invented deadlines.

---

## 6. Copy rules

Site copy follows stop-slop: be specific, name the thing, no vague declaratives.

Demo content fills the site during the build so you can see it working. Placeholder text, sample products and stand-in numbers are all fine, and they are marked `<!-- REPLACE: … -->` so a build-time check can list everything still needing your real data before launch.

Applied stop-slop rules for all site copy: active voice with a human subject, no adverbs, no em dashes, no "here's what" openers, no "not X, it's Y" constructions, varied sentence length, two items rather than three.

The spec ships with a copy worksheet listing every line needing a real number or a real quote from you.

---

## 7. Build order

| Step | Work | Ships |
|---|---|---|
| 1 | Split repo into `api/` and `web/`. Next.js scaffold, Tailwind v4, shadcn, `@kokonutui`, tokens, motion layer | Nothing visible |
| 2 | Migration `010`, admin fields for the new columns | Admin can enter real catalog data |
| 3 | Home page | Behind `/next`, then takes `/` |
| 4 | Browse and product pages | The ebook funnel works end to end |
| 5 | Checkout and order, Razorpay re-pointed and tested in test mode | Money flows through the new site |
| 6 | PromptKart pages | Second line live |
| 7 | Legacy pages unlinked, redirects added | Old tool URLs still resolve |

Razorpay is re-pointed, never rewritten, and gets a full test-mode pass before step 5 goes live.

---

## 8. Testing

- Unit tests for pricing, countdown maths and delivery payloads carry over from `tests/unit`
- End-to-end: a Playwright run buying an ebook in Razorpay test mode, asserting the PDF email fires
- Performance: Lighthouse CI on the homepage and one product page, failing the build on budget breach
- Accuracy guard: the existing `count('directinapp') == 0` assertion extends to site copy, so no internal brand word leaks

---

## 9. Open items

1. Real catalog data. Which ebook is finished and sellable on day one? Not blocking. The site gets built on demo content and the real products drop in through the admin panel.
2. Whether the six tools should be deleted rather than unlinked.
3. Refund policy wording, needed for the product page.

Resolved: Three.js stays, fenced to desktop and lazy-loaded.
