# Dropdesk Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild dropdesk.in as a bright, fast, mobile-first digital-products store selling Rapid-Revision exam PDFs and PromptKart prompt packs.

**Architecture:** The existing Express app moves intact into `api/` and becomes a pure JSON API plus worker on port 4000. A new Next.js App Router app in `web/` on port 3000 renders every page server-side and fetches from Express over HTTP. Next never touches Postgres directly. Razorpay, auth, email and object storage are re-pointed, never rewritten.

**Tech Stack:** Node 24, Express 4, PostgreSQL, Next.js 15 (App Router), React 19, Tailwind CSS v4, shadcn/ui + KokonutUI, Lenis, GSAP + ScrollTrigger, anime.js v4, Three.js, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-18-dropdesk-store-design.md`

## Global Constraints

- Node 24.14.1. Express stays CommonJS. Next/web is ESM + TypeScript.
- Express runs on port 4000. Next runs on port 3000. `PORT=3000` in `.env` today refers to Express and must be changed to 4000.
- Both product lines live in the existing `courses` table, separated by `kind`: `ebook`, `promptpack`. Legacy values `course` and `product` stay valid.
- Palette tokens, exact values: `--color-canvas #FFFFFF`, `--color-canvas-2 #F6F8FC`, `--color-ink #0B1020`, `--color-ink-soft #5A6480`, `--color-urgent #FF5A1F`, `--color-proof #12B981`. Brand blue `#3B4EF0` is applied by remapping shadcn's `--primary`, so `bg-primary` means Dropdesk blue for both storefront markup and shadcn/KokonutUI components.
- `web/app/globals.css` already carries shadcn's `base-nova` variable layer (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--radius`, the `@theme inline` block and the `@layer base` rules). KokonutUI components depend on it. It is extended and remapped, never replaced. Dropdesk tokens use names that do not collide with shadcn's: secondary body text is `text-ink-soft`, never `text-ink-soft` (shadcn's `muted` is a near-white background, not a text colour).
- `--urgent` appears only on real deadline data derived from `courses.exam_date`. Never decorative.
- Fonts: Big Shoulders (display), Instrument Sans (body), Geist Mono (numerals), Noto Sans Devanagari (Hindi). Hindi and Hinglish render at the same weight and size as English.
- Homepage first load under 180KB JS. Three.js sits outside that number, loads lazily, desktop only, never in the critical path.
- LCP under 2.5s on throttled 4G, Moto G class. CLS under 0.1.
- Every animation respects `prefers-reduced-motion`.
- Site copy follows stop-slop: active voice, no adverbs, no em dashes, no "here's what" openers, no "not X, it's Y" constructions, varied sentence length.
- Provisional content carries an `<!-- REPLACE: … -->` marker so the launch check can list it.
- The six creator tools, the invite-video generator and the carousel editor are out of scope. Their routes and URLs keep working. They are unlinked, never deleted.

---

## File Structure

**Moved (Task 1):**
- `routes/`, `services/`, `middleware/`, `migrations/`, `scripts/`, `utils/`, `tests/`, `assets/`, `storage/`, `server.js`, `package.json`, `package-lock.json` → `api/`
- `public/` stays at repo root, served by Express as legacy

**Created:**
- `package.json` (root) — orchestration scripts only
- `api/migrations/010_store_catalog.sql` — catalog columns, chapters, faqs, leads
- `api/routes/catalog.js` — store-shaped read API
- `api/tests/unit/catalog.test.js`
- `web/` — Next.js app (replaces the archived Vite scaffold)
- `web/app/layout.tsx`, `web/app/page.tsx`
- `web/app/revision/page.tsx`, `web/app/revision/[class]/[subject]/page.tsx`
- `web/app/promptkart/page.tsx`, `web/app/promptkart/[pack]/page.tsx`
- `web/app/checkout/page.tsx`, `web/app/order/[id]/page.tsx`
- `web/lib/api.ts` — typed Express client
- `web/lib/countdown.ts` — days-until maths
- `web/lib/motion/lenis.tsx`, `web/lib/motion/reveal.ts`, `web/lib/motion/counter.ts`
- `web/components/hero/HeroCanvas.tsx` — Three.js, lazy
- `web/app/globals.css` — Tailwind v4 theme tokens

---

## Task 1: Split the repo into api/ and web/

Moves the server without changing a line of its logic. Proves the move is safe by running the existing test suite before and after.

**Files:**
- Move: `routes/ services/ middleware/ migrations/ scripts/ utils/ tests/ assets/ storage/ server.js package.json package-lock.json` → `api/`
- Create: `package.json` (root)
- Modify: `.env` (`PORT=3000` → `PORT=4000`), `.env.example`
- Archive: `web/` → `_archive/web-vite/`

**Interfaces:**
- Consumes: nothing
- Produces: Express listening on 4000 serving `/api/*`; root scripts `npm run dev:api`, `npm run dev:web`, `npm run dev`

- [ ] **Step 1: Record the current test baseline**

```bash
npm test 2>&1 | tail -20
```

Write the pass/fail counts down. The same counts must appear at the end of this task.

- [ ] **Step 2: Archive the abandoned Vite scaffold**

It is untracked throwaway work and is being replaced by Next.js in Task 4.

```bash
mkdir -p _archive
mv web _archive/web-vite
echo "_archive/" >> .gitignore
```

- [ ] **Step 3: Move the server into api/**

```bash
mkdir -p api
git mv routes services middleware migrations scripts utils tests server.js package.json package-lock.json api/
mv assets storage api/ 2>/dev/null || true
```

`assets/` and `storage/` may be gitignored, so plain `mv` covers them.

- [ ] **Step 4: Remove the web-only dependency from the API package**

anime.js was installed at the root earlier and belongs to `web/`, not the API.

```bash
cd api && npm uninstall animejs && cd ..
```

- [ ] **Step 5: Reinstall API dependencies at their new path**

```bash
cd api && npm install && cd ..
```

- [ ] **Step 6: Change the Express port**

In `.env` and `.env.example`, change:

```
PORT=3000
```

to:

```
# Express API. The Next.js web app owns port 3000.
PORT=4000
```

- [ ] **Step 6b: Repoint the 14 static-file paths in server.js**

`server.js` now lives one directory deeper, but `public/` stayed at the repo root. All 14 `__dirname`-based references break. Add this constant directly below the existing `path` require in `api/server.js`:

```javascript
// public/ stays at the repo root; server.js now runs one level down in api/.
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
```

Then replace every occurrence of `path.join(__dirname, 'public'` with `path.join(PUBLIC_DIR`, dropping the now-duplicated `'public', ` argument. For example:

```javascript
app.use(express.static(PUBLIC_DIR, { index: 'index.html' }));
res.sendFile(path.join(PUBLIC_DIR, 'course.html'));
res.sendFile(path.join(PUBLIC_DIR, 'tools', `${tool.key}.html`));
```

Verify none remain:

```bash
grep -c "__dirname, 'public'" api/server.js
```

Expected: `0`

- [ ] **Step 6c: Confirm a legacy page still serves**

Start the API (`npm --prefix api run dev`), then in another shell:

```bash
curl -sI http://localhost:4000/tools/biodata | head -1
curl -sI http://localhost:4000/ | head -1
```

Expected: `HTTP/1.1 200 OK` for both. Paying customers reach these URLs, so a 404 here is a release blocker.

- [ ] **Step 7: Create the root orchestration package.json**

```json
{
  "name": "dropdesk",
  "private": true,
  "version": "1.0.0",
  "description": "Dropdesk — digital products store",
  "scripts": {
    "dev:api": "npm --prefix api run dev",
    "dev:web": "npm --prefix web run dev",
    "dev": "concurrently -n api,web -c blue,magenta \"npm run dev:api\" \"npm run dev:web\"",
    "test": "npm --prefix api test",
    "migrate": "npm --prefix api run migrate"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

- [ ] **Step 8: Install the root dev dependency**

```bash
npm install
```

- [ ] **Step 9: Run the test suite and confirm the baseline is unchanged**

```bash
npm test 2>&1 | tail -20
```

Expected: identical pass/fail counts to Step 1. Any new failure means a path broke in the move. Fix it before continuing.

- [ ] **Step 10: Confirm the API boots on its new port**

```bash
cd api && node -e "require('dotenv').config({path:'../.env'}); console.log('PORT is', process.env.PORT)"
```

Expected: `PORT is 4000`

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "refactor: move Express app into api/, reserve port 3000 for web"
```

---

## Task 2: Migration 010 — store catalog schema

**Files:**
- Create: `api/migrations/010_store_catalog.sql`
- Create: `api/tests/unit/catalog-schema.test.js`

**Interfaces:**
- Consumes: existing `courses` table, `schema_migrations` table
- Produces: columns `board, class_level, subject, exam_date, page_count, sample_pdf, language_mix, accent_color` on `courses`; tables `course_chapters(id, course_id, position, title)`, `course_faqs(id, course_id, position, question, answer)`, `leads(id, email, whatsapp, course_id, source, created_at)`

- [ ] **Step 1: Write the failing schema test**

Create `api/tests/unit/catalog-schema.test.js`. It follows the ephemeral-schema pattern already used by `api/tests/unit/db.test.js`.

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const SKIP = !TEST_DATABASE_URL;
const skipReason = SKIP ? 'TEST_DATABASE_URL/DATABASE_URL not set; skipping pg-backed tests' : '';

async function withSchema(fn) {
  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  const schema = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await pool.query(`CREATE SCHEMA "${schema}"`);
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO "${schema}"`);
    const dir = path.join(__dirname, '..', '..', 'migrations');
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
      await client.query(fs.readFileSync(path.join(dir, f), 'utf8'));
    }
    await fn(client);
  } finally {
    client.release();
    await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    await pool.end();
  }
}

test('010: courses gains the store catalog columns', { skip: skipReason }, async () => {
  await withSchema(async (c) => {
    const r = await c.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'courses' AND table_schema = current_schema()`
    );
    const cols = r.rows.map((x) => x.column_name);
    for (const col of ['board', 'class_level', 'subject', 'exam_date', 'page_count', 'sample_pdf', 'language_mix', 'accent_color']) {
      assert.ok(cols.includes(col), `missing column ${col}`);
    }
  });
});

test('010: chapters cascade-delete with their course', { skip: skipReason }, async () => {
  await withSchema(async (c) => {
    const ins = await c.query(
      `INSERT INTO courses (slug, title, original_price, discounted_price, kind)
       VALUES ('t-sci', 'Test Science', 99, 49, 'ebook') RETURNING id`
    );
    const id = ins.rows[0].id;
    await c.query(`INSERT INTO course_chapters (course_id, position, title) VALUES ($1, 1, 'Light')`, [id]);
    await c.query(`DELETE FROM courses WHERE id = $1`, [id]);
    const left = await c.query(`SELECT COUNT(*)::int AS n FROM course_chapters WHERE course_id = $1`, [id]);
    assert.equal(left.rows[0].n, 0);
  });
});

test('010: leads accepts a row with only whatsapp', { skip: skipReason }, async () => {
  await withSchema(async (c) => {
    await c.query(`INSERT INTO leads (whatsapp, source) VALUES ('+919000000000', 'reel')`);
    const r = await c.query(`SELECT COUNT(*)::int AS n FROM leads`);
    assert.equal(r.rows[0].n, 1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd api && node --test tests/unit/catalog-schema.test.js
```

Expected: FAIL, `missing column board` (or `relation "course_chapters" does not exist`).

- [ ] **Step 3: Write the migration**

Create `api/migrations/010_store_catalog.sql`:

```sql
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
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd api && node --test tests/unit/catalog-schema.test.js
```

Expected: 3 tests pass (or all skip if no `DATABASE_URL`, which is acceptable in CI without a database).

- [ ] **Step 5: Apply the migration to the dev database**

```bash
npm run migrate
```

Expected output includes `>  apply  010_store_catalog`.

- [ ] **Step 6: Commit**

```bash
git add api/migrations/010_store_catalog.sql api/tests/unit/catalog-schema.test.js
git commit -m "feat(db): add store catalog schema, chapters, faqs and leads"
```

---

## Task 3: Catalog API

The store needs reads the current `/api/courses` cannot serve: filter by class and subject, and a product payload carrying chapters and FAQs.

**Files:**
- Create: `api/routes/catalog.js`
- Create: `api/tests/unit/catalog-route.test.js`
- Modify: `api/server.js` (mount the router next to the existing ones, around line 24)

**Interfaces:**
- Consumes: `db.all`, `db.get` from `api/utils/db`; `calcDiscountPercent` from `api/utils/discount`
- Produces:
  - `GET /api/catalog?kind=ebook&class_level=10` → `CatalogItem[]`
  - `GET /api/catalog/:slug` → `CatalogItem & { chapters: Chapter[], faqs: Faq[] }`
  - `POST /api/catalog/leads` `{ email?, whatsapp?, course_id?, source? }` → `201 { ok: true }`
  - `CatalogItem` fields: `id, slug, title, short_description, thumbnail, original_price, discounted_price, discount_percent, kind, board, class_level, subject, exam_date, page_count, sample_pdf, language_mix, accent_color`
  - `Chapter`: `{ position, title }`. `Faq`: `{ position, question, answer }`

- [ ] **Step 1: Write the failing route test**

Create `api/tests/unit/catalog-route.test.js`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildListQuery, shapeItem } = require('../../routes/catalog');

test('buildListQuery: no filters returns published only', () => {
  const { sql, params } = buildListQuery({});
  assert.match(sql, /WHERE is_published = TRUE/);
  assert.deepEqual(params, []);
});

test('buildListQuery: filters by kind and class_level with ordered placeholders', () => {
  const { sql, params } = buildListQuery({ kind: 'ebook', class_level: '10' });
  assert.match(sql, /kind = \$1/);
  assert.match(sql, /class_level = \$2/);
  assert.deepEqual(params, ['ebook', '10']);
});

test('buildListQuery: ignores unknown filter keys', () => {
  const { params } = buildListQuery({ kind: 'ebook', drop_table: 'x' });
  assert.deepEqual(params, ['ebook']);
});

test('shapeItem: adds discount_percent', () => {
  const out = shapeItem({ original_price: 99, discounted_price: 49 });
  assert.equal(out.discount_percent, 51);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd api && node --test tests/unit/catalog-route.test.js
```

Expected: FAIL, `Cannot find module '../../routes/catalog'`.

- [ ] **Step 3: Write the route**

Create `api/routes/catalog.js`:

```javascript
const express = require('express');
const db = require('../utils/db');
const { calcDiscountPercent } = require('../utils/discount');

const router = express.Router();

const PUBLIC_COLS = `
  id, slug, title, short_description, description, thumbnail,
  original_price, discounted_price, kind,
  board, class_level, subject, exam_date, page_count,
  sample_pdf, language_mix, accent_color,
  (thumbnail_data IS NOT NULL) AS has_thumbnail`;

const FILTERABLE = ['kind', 'board', 'class_level', 'subject'];

function buildListQuery(query) {
  const params = [];
  let where = 'WHERE is_published = TRUE';
  for (const key of FILTERABLE) {
    if (query[key]) {
      params.push(query[key]);
      where += ` AND ${key} = $${params.length}`;
    }
  }
  const sql = `SELECT ${PUBLIC_COLS} FROM courses ${where} ORDER BY class_level, subject, created_at DESC`;
  return { sql, params };
}

function shapeItem(row) {
  return { ...row, discount_percent: calcDiscountPercent(row.original_price, row.discounted_price) };
}

router.get('/', async (req, res, next) => {
  try {
    const { sql, params } = buildListQuery(req.query);
    const rows = await db.all(sql, params);
    res.json(rows.map(shapeItem));
  } catch (e) { next(e); }
});

router.post('/leads', async (req, res, next) => {
  try {
    const { email, whatsapp, course_id, source } = req.body || {};
    if (!email && !whatsapp) return res.status(400).json({ error: 'email or whatsapp required' });
    await db.run(
      'INSERT INTO leads (email, whatsapp, course_id, source) VALUES ($1, $2, $3, $4)',
      [email || null, whatsapp || null, course_id || null, source || 'direct']
    );
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const item = await db.get(
      `SELECT ${PUBLIC_COLS} FROM courses WHERE slug = $1 AND is_published = TRUE`,
      [req.params.slug]
    );
    if (!item) return res.status(404).json({ error: 'not found' });
    const [chapters, faqs] = await Promise.all([
      db.all('SELECT position, title FROM course_chapters WHERE course_id = $1 ORDER BY position', [item.id]),
      db.all('SELECT position, question, answer FROM course_faqs WHERE course_id = $1 ORDER BY position', [item.id]),
    ]);
    res.json({ ...shapeItem(item), chapters, faqs });
  } catch (e) { next(e); }
});

module.exports = router;
module.exports.buildListQuery = buildListQuery;
module.exports.shapeItem = shapeItem;
```

`/leads` is declared before `/:slug` so the literal path wins over the wildcard.

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd api && node --test tests/unit/catalog-route.test.js
```

Expected: 4 tests pass.

- [ ] **Step 5: Mount the router**

In `api/server.js`, directly after the `/api/courses` line:

```javascript
app.use('/api/catalog', require('./routes/catalog'));
```

- [ ] **Step 6: Verify the whole suite still passes**

```bash
npm test 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add api/routes/catalog.js api/tests/unit/catalog-route.test.js api/server.js
git commit -m "feat(api): add catalog endpoints for the store"
```

---

## Task 4: Next.js scaffold

**Files:**
- Create: `web/` (Next.js 15, TypeScript, App Router, Tailwind v4)
- Create: `web/components.json` (shadcn + `@kokonutui` registry)
- Create: `web/.env.local`
- Create: `web/vitest.config.ts`

**Interfaces:**
- Consumes: Express on `http://localhost:4000`
- Produces: `npm --prefix web run dev` serving port 3000; `cn()` at `web/lib/utils.ts`; `API_BASE` from `web/lib/env.ts`

- [ ] **Step 1: Scaffold Next.js**

```bash
npx create-next-app@latest web --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*" --use-npm --no-turbopack
```

Answer `No` to any prompt offering to overwrite existing files.

- [ ] **Step 2: Point the web app at the API**

Create `web/.env.local`:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
API_BASE=http://localhost:4000
```

- [ ] **Step 3: Add the typed env accessor**

Create `web/lib/env.ts`:

```typescript
export const API_BASE = process.env.API_BASE ?? 'http://localhost:4000';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
```

- [ ] **Step 4: Initialise shadcn**

```bash
cd web && npx shadcn@latest init -d && cd ..
```

`-d` accepts defaults, which suit this project: new-york style, neutral base, CSS variables on.

- [ ] **Step 5: Register the KokonutUI registry**

Add to `web/components.json`, as a sibling of `aliases`:

```json
"registries": {
  "@kokonutui": "https://kokonutui.com/r/{name}.json"
}
```

- [ ] **Step 6: Install the motion and test dependencies**

```bash
cd web && npm install lenis gsap animejs three && npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @types/three && cd ..
```

- [ ] **Step 7: Configure Vitest**

Create `web/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
});
```

Add to `web/package.json` scripts:

```json
"test": "vitest run"
```

- [ ] **Step 8: Verify the dev server boots**

```bash
npm --prefix web run dev
```

Expected: `Ready on http://localhost:3000`. Stop it with Ctrl-C.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(web): scaffold Next.js app with Tailwind v4, shadcn and kokonutui registry"
```

Confirm `web/node_modules` is excluded by `web/.gitignore` before committing. `create-next-app` writes one; if it is missing, add it.

---

## Task 5: Design tokens and typography

**Files:**
- Modify: `web/app/globals.css`
- Modify: `web/app/layout.tsx`
- Create: `web/tests/tokens.test.ts`

**Interfaces:**
- Produces: CSS custom properties `--canvas --canvas-2 --ink --muted --primary --urgent --proof`; Tailwind utilities `bg-canvas text-ink text-ink-soft bg-primary text-urgent text-proof`; font variables `--font-display --font-body --font-mono --font-deva`

- [ ] **Step 1: Write the failing token test**

Create `web/tests/tokens.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const css = readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8');

describe('design tokens', () => {
  const expected: Record<string, string> = {
    '--color-canvas': '#FFFFFF',
    '--color-canvas-2': '#F6F8FC',
    '--color-ink': '#0B1020',
    '--color-ink-soft': '#5A6480',
    '--color-urgent': '#FF5A1F',
    '--color-proof': '#12B981',
  };

  for (const [token, value] of Object.entries(expected)) {
    it(`defines ${token} as ${value}`, () => {
      expect(css).toContain(`${token}: ${value}`);
    });
  }

  it('declares the four font families', () => {
    for (const f of ['--font-display', '--font-body', '--font-mono', '--font-deva']) {
      expect(css).toContain(f);
    }
  });

  // shadcn's variable layer must survive, or every shadcn/KokonutUI
  // component loses its colours.
  it('keeps shadcn base-nova variables intact', () => {
    for (const v of ['--background', '--foreground', '--primary-foreground', '--border', '--radius']) {
      expect(css).toContain(v);
    }
    expect(css).toContain('@theme inline');
  });

  it('remaps shadcn primary to the Dropdesk brand blue', () => {
    expect(css).toContain('--primary: #3B4EF0');
  });

  // shadcn's own `@theme inline` legitimately maps `--color-muted: var(--muted)`
  // and button.tsx uses `bg-muted`. What must never happen is Dropdesk binding
  // its body-text colour to that namespace, which would put near-white text on
  // a near-white background.
  it('never binds the Dropdesk body-text colour to shadcn\'s muted namespace', () => {
    expect(css).not.toContain('--color-muted: #5A6480');
    expect(css).toContain('--color-ink-soft: #5A6480');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm --prefix web test
```

Expected: FAIL on `--color-canvas`.

- [ ] **Step 3: Write the theme**

**Do not replace `web/app/globals.css`.** It already carries shadcn's `base-nova` layer, which every shadcn and KokonutUI component depends on. Extend it instead, making three edits:

**Edit 1 — add a Dropdesk `@theme` block** directly after the existing `@theme inline { … }` block. These names are chosen not to collide with shadcn's:

```css
/* Dropdesk storefront tokens. Names avoid shadcn's namespace on purpose:
   shadcn's `muted` is a near-white background, ours is body text. */
@theme {
  --color-canvas: #FFFFFF;
  --color-canvas-2: #F6F8FC;
  --color-ink: #0B1020;
  --color-ink-soft: #5A6480;
  --color-urgent: #FF5A1F;
  --color-proof: #12B981;

  --font-display: var(--font-big-shoulders), system-ui, sans-serif;
  --font-body: var(--font-instrument), system-ui, sans-serif;
  --font-deva: var(--font-noto-deva), var(--font-instrument), sans-serif;

  --radius-card: 16px;
}
```

Do NOT declare `--color-primary` or `--color-muted` here. `primary` is owned by shadcn and remapped in Edit 2; `muted` stays shadcn's.

**Edit 2 — remap four shadcn variables inside the existing `:root` block** so shadcn components adopt the Dropdesk palette. Replace only these four lines, leaving every other variable untouched:

```css
  --background: #FFFFFF;
  --foreground: #0B1020;
  --primary: #3B4EF0;
  --primary-foreground: #FFFFFF;
```

This is what makes `bg-primary` mean Dropdesk blue for the hero markup and for shadcn's `button.tsx` at the same time.

**Edit 3 — append the base rules** at the end of the file, after the existing `@layer base` block:

```css
/* shadcn's @layer base applies `font-sans` to <html>, and its @theme inline
   maps --font-sans to a variable nothing defines yet. Point it at Instrument
   Sans so shadcn components and storefront markup share one body face. */
:root { --font-sans: var(--font-instrument); }

html { -webkit-text-size-adjust: 100%; }

body {
  background: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-body);
}

/* Hindi and Hinglish set at the same weight and size as English. */
:lang(hi), .deva { font-family: var(--font-deva); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Leave the `.dark` block alone. The storefront ships light-only, and deleting it would break shadcn components that reference those variables.

- [ ] **Step 4: Load the fonts**

Replace `web/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Big_Shoulders_Display, Instrument_Sans, Geist_Mono, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';

const display = Big_Shoulders_Display({ subsets: ['latin'], variable: '--font-big-shoulders', weight: ['600', '700', '800'] });
const body = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
const deva = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-noto-deva', weight: ['400', '700'] });

export const metadata: Metadata = {
  title: 'Dropdesk — exam revision PDFs and prompt packs',
  description: 'Revise a whole subject in one sitting. Instant PDF delivery, pay by UPI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} ${deva.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npm --prefix web test
```

Expected: 8 tests pass.

- [ ] **Step 6: Commit**

```bash
git add web/app/globals.css web/app/layout.tsx web/tests/tokens.test.ts
git commit -m "feat(web): add Dropdesk design tokens and typography"
```

---

## Task 6: API client and countdown

**Files:**
- Create: `web/lib/api.ts`
- Create: `web/lib/countdown.ts`
- Create: `web/tests/countdown.test.ts`

**Interfaces:**
- Consumes: `API_BASE` from `web/lib/env.ts`; `GET /api/catalog` from Task 3
- Produces:
  - `type CatalogItem`, `type CatalogDetail`
  - `listCatalog(filters?: { kind?, board?, class_level?, subject? }): Promise<CatalogItem[]>`
  - `getCatalogItem(slug: string): Promise<CatalogDetail | null>`
  - `daysUntil(examDate: string | null, now?: Date): number | null`
  - `countdownLabel(days: number | null): string | null`

- [ ] **Step 1: Write the failing countdown test**

Create `web/tests/countdown.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { daysUntil, countdownLabel } from '@/lib/countdown';

describe('daysUntil', () => {
  const now = new Date('2026-02-01T10:00:00+05:30');

  it('counts whole days ahead', () => {
    expect(daysUntil('2026-02-24', now)).toBe(23);
  });

  it('returns 0 on exam day', () => {
    expect(daysUntil('2026-02-01', now)).toBe(0);
  });

  it('returns null once the date has passed', () => {
    expect(daysUntil('2026-01-20', now)).toBeNull();
  });

  it('returns null when no date is set', () => {
    expect(daysUntil(null, now)).toBeNull();
  });
});

describe('countdownLabel', () => {
  it('names the day when the exam is tomorrow', () => {
    expect(countdownLabel(1)).toBe('Exam tomorrow');
  });

  it('names the day when the exam is today', () => {
    expect(countdownLabel(0)).toBe('Exam today');
  });

  it('counts plain days otherwise', () => {
    expect(countdownLabel(23)).toBe('Exam in 23 days');
  });

  it('returns null with no countdown', () => {
    expect(countdownLabel(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm --prefix web test
```

Expected: FAIL, cannot resolve `@/lib/countdown`.

- [ ] **Step 3: Write the countdown module**

Create `web/lib/countdown.ts`:

```typescript
const DAY_MS = 86_400_000;

/** Whole days from `now` to `examDate`. Null when unset or already past. */
export function daysUntil(examDate: string | null, now: Date = new Date()): number | null {
  if (!examDate) return null;
  const exam = new Date(`${examDate}T00:00:00+05:30`);
  if (Number.isNaN(exam.getTime())) return null;
  const today = new Date(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) + 'T00:00:00+05:30');
  const days = Math.round((exam.getTime() - today.getTime()) / DAY_MS);
  return days < 0 ? null : days;
}

export function countdownLabel(days: number | null): string | null {
  if (days === null) return null;
  if (days === 0) return 'Exam today';
  if (days === 1) return 'Exam tomorrow';
  return `Exam in ${days} days`;
}
```

Dates are anchored to Asia/Kolkata because every buyer and every exam sits in that timezone.

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm --prefix web test
```

Expected: 8 countdown tests pass.

- [ ] **Step 5: Write the API client**

Create `web/lib/api.ts`:

```typescript
import { API_BASE } from './env';

export type CatalogItem = {
  id: number;
  slug: string;
  title: string;
  short_description: string | null;
  thumbnail: string | null;
  has_thumbnail: boolean;
  original_price: string;
  discounted_price: string;
  discount_percent: number;
  kind: 'ebook' | 'promptpack' | 'course' | 'product';
  board: string | null;
  class_level: string | null;
  subject: string | null;
  exam_date: string | null;
  page_count: number | null;
  sample_pdf: string | null;
  language_mix: string | null;
  accent_color: string | null;
};

export type Chapter = { position: number; title: string };
export type Faq = { position: number; question: string; answer: string };
export type CatalogDetail = CatalogItem & { description: string | null; chapters: Chapter[]; faqs: Faq[] };

type Filters = { kind?: string; board?: string; class_level?: string; subject?: string };

// A dead API degrades to an empty shelf, never a 500. `fetch` throws outright
// when the Express process is down, so `!res.ok` alone is not enough — without
// the catch, every page rendering a shelf crashes when the API restarts.
export async function listCatalog(filters: Filters = {}): Promise<CatalogItem[]> {
  const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => Boolean(v)) as [string, string][]);
  try {
    const res = await fetch(`${API_BASE}/api/catalog?${qs}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getCatalogItem(slug: string): Promise<CatalogDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/catalog/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function priceLabel(rupees: string | number): string {
  return `₹${Math.round(Number(rupees))}`;
}
```

A failed list returns an empty array so a dead API degrades to an empty shelf rather than a crashed page.

- [ ] **Step 6: Commit**

```bash
git add web/lib/api.ts web/lib/countdown.ts web/tests/countdown.test.ts
git commit -m "feat(web): add catalog API client and exam countdown"
```

---

## Task 7: Motion layer

**Files:**
- Create: `web/lib/motion/SmoothScroll.tsx`
- Create: `web/lib/motion/reveal.ts`
- Create: `web/tests/reveal.test.ts`
- Modify: `web/app/layout.tsx`

**Interfaces:**
- Consumes: `lenis`, `gsap`
- Produces: `<SmoothScroll>` client wrapper; `useReveal(ref, opts?)` hook; `prefersReducedMotion(): boolean`

- [ ] **Step 1: Write the failing reduced-motion test**

Create `web/tests/reveal.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { prefersReducedMotion } from '@/lib/motion/reveal';

function mockMatchMedia(reduced: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: reduced && q.includes('reduce'),
    media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
}

describe('prefersReducedMotion', () => {
  it('is true when the user asked for reduced motion', () => {
    mockMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
  });

  it('is false otherwise', () => {
    mockMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm --prefix web test
```

Expected: FAIL, cannot resolve `@/lib/motion/reveal`.

- [ ] **Step 3: Write the reveal module**

Create `web/lib/motion/reveal.ts`:

```typescript
'use client';
import { useEffect, type RefObject } from 'react';

export function prefersReducedMotion(): boolean {
  if (typeof matchMedia !== 'function') return false;
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Fades and lifts an element into view once. Does nothing under reduced motion. */
export function useReveal(ref: RefObject<HTMLElement | null>, delay = 0) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { el.style.opacity = '1'; return; }

    let cancelled = false;
    (async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      gsap.fromTo(el,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, delay, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    })();

    return () => { cancelled = true; };
  }, [ref, delay]);
}
```

GSAP is imported dynamically so it stays out of the first-load bundle.

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm --prefix web test
```

Expected: 2 reveal tests pass.

- [ ] **Step 5: Write the smooth-scroll wrapper**

Create `web/lib/motion/SmoothScroll.tsx`:

```tsx
'use client';
import { useEffect } from 'react';
import { prefersReducedMotion } from './reveal';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let frame = 0;
    let cancelled = false;

    (async () => {
      const Lenis = (await import('lenis')).default;
      if (cancelled) return;
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      const loop = (time: number) => { lenis?.raf(time); frame = requestAnimationFrame(loop); };
      frame = requestAnimationFrame(loop);
    })();

    return () => { cancelled = true; cancelAnimationFrame(frame); lenis?.destroy(); };
  }, []);

  return <>{children}</>;
}
```

- [ ] **Step 6: Mount it in the layout**

In `web/app/layout.tsx`, import it and wrap the children:

```tsx
import SmoothScroll from '@/lib/motion/SmoothScroll';
```

```tsx
<body><SmoothScroll>{children}</SmoothScroll></body>
```

- [ ] **Step 7: Commit**

```bash
git add web/lib/motion web/tests/reveal.test.ts web/app/layout.tsx
git commit -m "feat(web): add Lenis smooth scroll and GSAP reveal, both reduced-motion safe"
```

---

## Task 8: Homepage

**Files:**
- Create: `web/components/store/ProductCard.tsx`
- Create: `web/components/store/CountdownBadge.tsx`
- Modify: `web/app/page.tsx`
- Create: `web/tests/ProductCard.test.tsx`

**Interfaces:**
- Consumes: `listCatalog`, `priceLabel`, `CatalogItem` (Task 6); `daysUntil`, `countdownLabel` (Task 6); `useReveal` (Task 7)
- Produces: `<ProductCard item={CatalogItem} />`, `<CountdownBadge examDate={string | null} />`

- [ ] **Step 1: Write the failing card test**

Create `web/tests/ProductCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductCard from '@/components/store/ProductCard';
import type { CatalogItem } from '@/lib/api';

const item: CatalogItem = {
  id: 1, slug: 'class-10-science', title: 'Class 10 Science',
  short_description: 'Revise the whole subject in one sitting.',
  thumbnail: null, has_thumbnail: false,
  original_price: '99', discounted_price: '49', discount_percent: 51,
  kind: 'ebook', board: 'CBSE', class_level: '10', subject: 'Science',
  exam_date: null, page_count: 20, sample_pdf: null,
  language_mix: 'en', accent_color: '#12B981',
};

describe('ProductCard', () => {
  it('shows the title and the price the buyer pays', () => {
    render(<ProductCard item={item} />);
    expect(screen.getByText('Class 10 Science')).toBeDefined();
    expect(screen.getByText('₹49')).toBeDefined();
  });

  it('shows the struck-through original price', () => {
    render(<ProductCard item={item} />);
    expect(screen.getByText('₹99')).toBeDefined();
  });

  it('states the page count, because 20 pages is the product', () => {
    render(<ProductCard item={item} />);
    expect(screen.getByText(/20 pages/)).toBeDefined();
  });

  it('links to the product page', () => {
    render(<ProductCard item={item} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/revision/10/science');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm --prefix web test
```

Expected: FAIL, cannot resolve `@/components/store/ProductCard`.

- [ ] **Step 3: Write the countdown badge**

Create `web/components/store/CountdownBadge.tsx`:

```tsx
import { daysUntil, countdownLabel } from '@/lib/countdown';

/** Renders only for a real future exam_date. Never decorative. */
export default function CountdownBadge({ examDate }: { examDate: string | null }) {
  const label = countdownLabel(daysUntil(examDate));
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-urgent/10 px-3 py-1 font-mono text-xs font-semibold text-urgent">
      {label}
    </span>
  );
}
```

- [ ] **Step 4: Write the product card**

Create `web/components/store/ProductCard.tsx`:

```tsx
import Link from 'next/link';
import { priceLabel, type CatalogItem } from '@/lib/api';
import CountdownBadge from './CountdownBadge';

function href(item: CatalogItem): string {
  if (item.kind === 'promptpack') return `/promptkart/${item.slug}`;
  if (item.class_level && item.subject) {
    return `/revision/${item.class_level}/${item.subject.toLowerCase()}`;
  }
  return `/revision/${item.slug}`;
}

export default function ProductCard({ item }: { item: CatalogItem }) {
  return (
    <Link
      href={href(item)}
      className="group flex flex-col gap-3 rounded-card bg-canvas-2 p-4 transition-transform hover:-translate-y-1"
    >
      <div
        className="aspect-[3/4] w-full rounded-lg bg-ink"
        style={item.accent_color ? { boxShadow: `inset 0 -60px 60px -40px ${item.accent_color}` } : undefined}
      />
      <div className="flex flex-wrap items-center gap-2">
        <CountdownBadge examDate={item.exam_date} />
        {item.page_count ? (
          <span className="font-mono text-xs text-ink-soft">{item.page_count} pages</span>
        ) : null}
      </div>
      <h3 className="font-display text-xl font-bold leading-tight">{item.title}</h3>
      {item.short_description ? (
        <p className="text-sm text-ink-soft">{item.short_description}</p>
      ) : null}
      <div className="mt-auto flex items-baseline gap-2">
        <span className="font-display text-2xl font-extrabold text-primary">{priceLabel(item.discounted_price)}</span>
        <span className="text-sm text-ink-soft line-through">{priceLabel(item.original_price)}</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npm --prefix web test
```

Expected: 4 ProductCard tests pass.

- [ ] **Step 6: Write the homepage**

Replace `web/app/page.tsx`:

```tsx
import Link from 'next/link';
import { listCatalog } from '@/lib/api';
import ProductCard from '@/components/store/ProductCard';

export const revalidate = 60;

export default async function Home() {
  const [ebooks, packs] = await Promise.all([
    listCatalog({ kind: 'ebook' }),
    listCatalog({ kind: 'promptpack' }),
  ]);

  return (
    <main>
      <section className="bg-primary px-5 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            Revise a whole subject in one sitting.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">
            Twenty pages per subject, one page per chapter. Pay by UPI and the PDF reaches your
            inbox in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/revision" className="rounded-full bg-white px-6 py-3 font-semibold text-primary">
              Browse exam revision
            </Link>
            <Link href="/promptkart" className="rounded-full border border-white/40 px-6 py-3 font-semibold">
              Browse PromptKart
            </Link>
          </div>
        </div>
      </section>

      <Shelf title="Exam revision" items={ebooks} href="/revision" />
      <Shelf title="PromptKart" items={packs} href="/promptkart" />

      <section className="bg-canvas-2 px-5 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          <Fact head="Pay by UPI" body="Cards and netbanking work too, through Razorpay." />
          <Fact head="Instant delivery" body="The PDF arrives by email as soon as payment clears." />
          <Fact head="No account needed" body="Buy with an email address and nothing else." />
        </div>
      </section>
    </main>
  );
}

function Shelf({ title, items, href }: { title: string; items: Awaited<ReturnType<typeof listCatalog>>; href: string }) {
  if (items.length === 0) return null;
  return (
    <section className="px-5 py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-3xl font-bold">{title}</h2>
          <Link href={href} className="text-sm font-semibold text-primary">See all</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.slice(0, 4).map((item) => <ProductCard key={item.id} item={item} />)}
        </div>
      </div>
    </section>
  );
}

function Fact({ head, body }: { head: string; body: string }) {
  return (
    <div>
      <h3 className="font-display text-xl font-bold">{head}</h3>
      <p className="mt-1 text-sm text-ink-soft">{body}</p>
    </div>
  );
}
```

`Shelf` returns null on an empty list, so the page never shows a heading above nothing.

- [ ] **Step 7: Check it renders against the running API**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: blue hero, two shelves populated from Postgres, no console errors. Stop with Ctrl-C.

- [ ] **Step 8: Commit**

```bash
git add web/app/page.tsx web/components/store web/tests/ProductCard.test.tsx
git commit -m "feat(web): add homepage with product shelves and countdown badges"
```

---

## Task 9: Browse page

**Files:**
- Create: `web/app/revision/page.tsx`
- Create: `web/lib/groupByClass.ts`
- Create: `web/tests/groupByClass.test.ts`

**Interfaces:**
- Consumes: `listCatalog`, `CatalogItem` (Task 6); `ProductCard` (Task 8)
- Produces: `groupByClass(items: CatalogItem[]): { classLevel: string; items: CatalogItem[] }[]`, ordered 9, 10, 11, 12, then SSC, then anything else

- [ ] **Step 1: Write the failing grouping test**

Create `web/tests/groupByClass.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { groupByClass } from '@/lib/groupByClass';
import type { CatalogItem } from '@/lib/api';

const make = (class_level: string | null, slug: string): CatalogItem => ({
  id: Math.random(), slug, title: slug, short_description: null, thumbnail: null,
  has_thumbnail: false, original_price: '99', discounted_price: '49', discount_percent: 51,
  kind: 'ebook', board: 'CBSE', class_level, subject: 'Science', exam_date: null,
  page_count: 20, sample_pdf: null, language_mix: 'en', accent_color: null,
});

describe('groupByClass', () => {
  it('orders classes 9, 10, 11, 12 then ssc-cgl', () => {
    const out = groupByClass([make('12', 'a'), make('ssc-cgl', 'b'), make('9', 'c'), make('10', 'd')]);
    expect(out.map((g) => g.classLevel)).toEqual(['9', '10', '12', 'ssc-cgl']);
  });

  it('groups several subjects under one class', () => {
    const out = groupByClass([make('10', 'sci'), make('10', 'math')]);
    expect(out).toHaveLength(1);
    expect(out[0].items).toHaveLength(2);
  });

  it('drops items with no class level', () => {
    expect(groupByClass([make(null, 'x')])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm --prefix web test
```

Expected: FAIL, cannot resolve `@/lib/groupByClass`.

- [ ] **Step 3: Write the grouping module**

Create `web/lib/groupByClass.ts`:

```typescript
import type { CatalogItem } from './api';

const ORDER = ['9', '10', '11', '12', 'ssc-cgl'];

export type ClassGroup = { classLevel: string; items: CatalogItem[] };

export function groupByClass(items: CatalogItem[]): ClassGroup[] {
  const buckets = new Map<string, CatalogItem[]>();
  for (const item of items) {
    if (!item.class_level) continue;
    const list = buckets.get(item.class_level) ?? [];
    list.push(item);
    buckets.set(item.class_level, list);
  }
  return [...buckets.entries()]
    .map(([classLevel, list]) => ({ classLevel, items: list }))
    .sort((a, b) => {
      const ai = ORDER.indexOf(a.classLevel);
      const bi = ORDER.indexOf(b.classLevel);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
}

export function classLabel(classLevel: string): string {
  return classLevel === 'ssc-cgl' ? 'SSC CGL' : `Class ${classLevel}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm --prefix web test
```

Expected: 3 grouping tests pass.

- [ ] **Step 5: Write the browse page**

Create `web/app/revision/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { listCatalog } from '@/lib/api';
import { groupByClass, classLabel } from '@/lib/groupByClass';
import ProductCard from '@/components/store/ProductCard';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Exam revision PDFs — Dropdesk',
  description: 'Twenty-page revision PDFs for CBSE, UP Board and SSC CGL. One page per chapter.',
};

export default async function RevisionIndex() {
  const groups = groupByClass(await listCatalog({ kind: 'ebook' }));

  return (
    <main className="px-5 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-4xl font-extrabold">Exam revision</h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          Pick your class, then your subject. Every book runs twenty pages, one page per chapter.
        </p>

        {groups.length === 0 ? (
          <p className="mt-12 text-ink-soft">Nothing published yet.</p>
        ) : (
          groups.map((group) => (
            <section key={group.classLevel} className="mt-12">
              <h2 className="font-display text-2xl font-bold">{classLabel(group.classLevel)}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {group.items.map((item) => <ProductCard key={item.id} item={item} />)}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add web/app/revision/page.tsx web/lib/groupByClass.ts web/tests/groupByClass.test.ts
git commit -m "feat(web): add revision browse page grouped by class"
```

---

## Task 10: Product page

The money page. Price and buy button must be reachable without scrolling on a 390px screen.

**Files:**
- Create: `web/app/revision/[class]/[subject]/page.tsx`
- Create: `web/components/store/BuyBar.tsx`
- Create: `web/components/store/ChapterList.tsx`
- Create: `web/tests/ChapterList.test.tsx`

**Interfaces:**
- Consumes: `listCatalog`, `getCatalogItem`, `priceLabel` (Task 6); `CountdownBadge` (Task 8)
- Produces: `<BuyBar item={CatalogDetail} />`, `<ChapterList chapters={Chapter[]} />`

- [ ] **Step 1: Write the failing chapter list test**

Create `web/tests/ChapterList.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChapterList from '@/components/store/ChapterList';

describe('ChapterList', () => {
  it('numbers each chapter by position', () => {
    render(<ChapterList chapters={[{ position: 1, title: 'Light' }, { position: 2, title: 'Acids' }]} />);
    expect(screen.getByText('Light')).toBeDefined();
    expect(screen.getByText('Acids')).toBeDefined();
    expect(screen.getByText('01')).toBeDefined();
    expect(screen.getByText('02')).toBeDefined();
  });

  it('renders nothing when there are no chapters', () => {
    const { container } = render(<ChapterList chapters={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm --prefix web test
```

Expected: FAIL, cannot resolve `@/components/store/ChapterList`.

- [ ] **Step 3: Write the chapter list**

Create `web/components/store/ChapterList.tsx`:

```tsx
import type { Chapter } from '@/lib/api';

export default function ChapterList({ chapters }: { chapters: Chapter[] }) {
  if (chapters.length === 0) return null;
  return (
    <ol className="divide-y divide-ink/10">
      {chapters.map((c) => (
        <li key={c.position} className="flex items-baseline gap-4 py-3">
          <span className="font-mono text-xs text-ink-soft">{String(c.position).padStart(2, '0')}</span>
          <span>{c.title}</span>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm --prefix web test
```

Expected: 2 ChapterList tests pass.

- [ ] **Step 5: Write the buy bar**

Create `web/components/store/BuyBar.tsx`:

```tsx
import Link from 'next/link';
import { priceLabel, type CatalogDetail } from '@/lib/api';

export default function BuyBar({ item }: { item: CatalogDetail }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-card bg-canvas-2 p-5">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-extrabold text-primary">{priceLabel(item.discounted_price)}</span>
          <span className="text-ink-soft line-through">{priceLabel(item.original_price)}</span>
        </div>
        <p className="mt-1 text-xs text-ink-soft">{item.discount_percent}% off. UPI, cards and netbanking.</p>
      </div>
      <Link
        href={`/checkout?slug=${item.slug}`}
        className="ml-auto rounded-full bg-primary px-8 py-3 font-semibold text-white"
      >
        Buy now
      </Link>
    </div>
  );
}
```

- [ ] **Step 6: Write the product page**

Create `web/app/revision/[class]/[subject]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { listCatalog, getCatalogItem } from '@/lib/api';
import CountdownBadge from '@/components/store/CountdownBadge';
import ChapterList from '@/components/store/ChapterList';
import BuyBar from '@/components/store/BuyBar';

export const revalidate = 60;

type Params = { class: string; subject: string };

async function findSlug({ class: classLevel, subject }: Params): Promise<string | null> {
  const items = await listCatalog({ kind: 'ebook', class_level: classLevel });
  const match = items.find((i) => i.subject?.toLowerCase() === subject.toLowerCase());
  return match?.slug ?? null;
}

export async function generateStaticParams() {
  const items = await listCatalog({ kind: 'ebook' });
  return items
    .filter((i) => i.class_level && i.subject)
    .map((i) => ({ class: i.class_level!, subject: i.subject!.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const slug = await findSlug(await params);
  const item = slug ? await getCatalogItem(slug) : null;
  if (!item) return { title: 'Not found — Dropdesk' };
  return {
    title: `${item.title} — Dropdesk`,
    description: item.short_description ?? undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const slug = await findSlug(await params);
  const item = slug ? await getCatalogItem(slug) : null;
  if (!item) notFound();

  return (
    <main className="px-5 py-10">
      <article className="mx-auto max-w-3xl">
        <CountdownBadge examDate={item.exam_date} />
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight">{item.title}</h1>
        {item.short_description ? <p className="mt-3 text-lg text-ink-soft">{item.short_description}</p> : null}

        <div className="mt-6"><BuyBar item={item} /></div>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">What you get</h2>
          <p className="mt-2 text-ink-soft">
            {item.page_count ?? 20} pages, one page per chapter. The compression is the point. You
            can read the whole subject the night before the exam.
          </p>
        </section>

        {item.chapters.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-bold">Chapters</h2>
            <div className="mt-3"><ChapterList chapters={item.chapters} /></div>
          </section>
        ) : null}

        {item.faqs.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-bold">Questions</h2>
            <dl className="mt-3 divide-y divide-ink/10">
              {item.faqs.map((f) => (
                <div key={f.position} className="py-4">
                  <dt className="font-semibold">{f.question}</dt>
                  <dd className="mt-1 text-ink-soft">{f.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <div className="mt-12"><BuyBar item={item} /></div>
      </article>
    </main>
  );
}
```

- [ ] **Step 7: Verify the page renders**

```bash
npm run dev
```

Visit a real product URL, for example `http://localhost:3000/revision/10/science`. Expected: countdown badge only if `exam_date` is set and future, price and Buy now visible without scrolling on a 390px viewport.

- [ ] **Step 8: Commit**

```bash
git add web/app/revision web/components/store web/tests/ChapterList.test.tsx
git commit -m "feat(web): add product page with chapters, faqs and buy bar"
```

---

## Task 11: Checkout and order pages

Razorpay is re-pointed, never rewritten. The existing `POST /api/orders` and its webhook keep their contract.

**Files:**
- Create: `web/app/checkout/page.tsx`
- Create: `web/app/order/[id]/page.tsx`
- Create: `web/components/store/RazorpayButton.tsx`
- Modify: `api/server.js` (CORS allowlist)

**Interfaces:**
- Consumes: `getCatalogItem` (Task 6); existing `POST /api/orders` from `api/routes/orders.js`
- Produces: `<RazorpayButton item={CatalogDetail} email={string} />`

- [ ] **Step 1: Read the existing order contract**

```bash
sed -n '1,80p' api/routes/orders.js
```

Note the exact request body `POST /api/orders` expects and the exact response fields. The next step must match them. Do not change the route.

- [ ] **Step 2: Restrict CORS to the web origin**

In `api/server.js`, replace the permissive CORS line:

```javascript
app.use(cors({ origin: true, credentials: true }));
```

with:

```javascript
const ALLOWED_ORIGINS = (process.env.WEB_ORIGIN || 'http://localhost:3000').split(',');
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
```

Add `WEB_ORIGIN=http://localhost:3000` to `.env` and `.env.example`.

- [ ] **Step 3: Write the Razorpay button**

Create `web/components/store/RazorpayButton.tsx`. Adjust the request body in `createOrder` to match what Step 1 showed.

```tsx
'use client';
import { useState } from 'react';
import Script from 'next/script';
import { priceLabel, type CatalogDetail } from '@/lib/api';

declare global { interface Window { Razorpay?: new (o: unknown) => { open: () => void } } }

const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';

export default function RazorpayButton({ item, email }: { item: CatalogDetail; email: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_slug: item.slug, email }),
      });
      if (!res.ok) throw new Error('Could not start the payment');
      const order = await res.json();

      const rz = new window.Razorpay!({
        key: order.key_id,
        order_id: order.razorpay_order_id,
        amount: order.amount,
        currency: 'INR',
        name: 'Dropdesk',
        description: item.title,
        prefill: { email },
        handler: () => { window.location.href = `/order/${order.order_id}`; },
      });
      rz.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <button
        onClick={pay}
        disabled={busy || !email}
        className="w-full rounded-full bg-primary px-8 py-4 font-semibold text-white disabled:opacity-50"
      >
        {busy ? 'Opening payment…' : `Pay ${priceLabel(item.discounted_price)}`}
      </button>
      {error ? <p className="mt-2 text-sm text-urgent">{error}</p> : null}
    </>
  );
}
```

Add `NEXT_PUBLIC_API_BASE=http://localhost:4000` to `web/.env.local`.

- [ ] **Step 4: Write the checkout page**

Create `web/app/checkout/page.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import RazorpayButton from '@/components/store/RazorpayButton';
import { priceLabel, type CatalogDetail } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';

export default function Checkout() {
  const slug = useSearchParams().get('slug');
  const [item, setItem] = useState<CatalogDetail | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/api/catalog/${slug}`).then((r) => (r.ok ? r.json() : null)).then(setItem);
  }, [slug]);

  if (!slug) return <main className="p-10">No product selected.</main>;
  if (!item) return <main className="p-10">Loading…</main>;

  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <h1 className="font-display text-3xl font-extrabold">Checkout</h1>

      <div className="mt-6 rounded-card bg-canvas-2 p-5">
        <p className="font-semibold">{item.title}</p>
        <p className="mt-1 font-display text-2xl font-extrabold text-primary">
          {priceLabel(item.discounted_price)}
        </p>
      </div>

      <label className="mt-6 block">
        <span className="text-sm font-semibold">Email for delivery</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3"
        />
        <span className="mt-1 block text-xs text-ink-soft">The PDF goes to this address.</span>
      </label>

      <div className="mt-6"><RazorpayButton item={item} email={email} /></div>
    </main>
  );
}
```

- [ ] **Step 5: Write the order confirmation page**

Create `web/app/order/[id]/page.tsx`:

```tsx
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-md px-5 py-16 text-center">
      <h1 className="font-display text-3xl font-extrabold">Payment received</h1>
      <p className="mt-3 text-ink-soft">
        Your PDF is on its way by email. It usually arrives within a minute.
      </p>
      <p className="mt-6 font-mono text-xs text-ink-soft">Order {id}</p>
    </main>
  );
}
```

- [ ] **Step 6: Test the full purchase in Razorpay test mode**

With Razorpay test keys in `.env`, run `npm run dev`, open a product, click Buy now, enter an email and pay with Razorpay's test card. Confirm three things: the order row appears in Postgres, the delivery email fires, and the browser lands on `/order/<id>`.

- [ ] **Step 7: Commit**

```bash
git add web/app/checkout web/app/order web/components/store/RazorpayButton.tsx api/server.js .env.example
git commit -m "feat(web): add checkout and order pages against the existing Razorpay flow"
```

---

## Task 12: PromptKart pages

**Files:**
- Create: `web/app/promptkart/page.tsx`
- Create: `web/app/promptkart/[pack]/page.tsx`

**Interfaces:**
- Consumes: `listCatalog`, `getCatalogItem` (Task 6); `ProductCard` (Task 8); `BuyBar` (Task 10)

- [ ] **Step 1: Write the pack listing**

Create `web/app/promptkart/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { listCatalog } from '@/lib/api';
import ProductCard from '@/components/store/ProductCard';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'PromptKart — prompt packs by Dropdesk',
  description: 'DALL·E 3 prompt packs for carousels and thumbnails. Every pack ships with sample output.',
};

export default async function PromptKart() {
  const packs = await listCatalog({ kind: 'promptpack' });
  return (
    <main className="px-5 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-4xl font-extrabold">PromptKart</h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          Prompt packs for carousels and thumbnails. Every pack shows the output it produces.
        </p>
        {packs.length === 0 ? (
          <p className="mt-12 text-ink-soft">Nothing published yet.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packs.map((p) => <ProductCard key={p.id} item={p} />)}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Write the pack page**

Create `web/app/promptkart/[pack]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getCatalogItem, listCatalog } from '@/lib/api';
import BuyBar from '@/components/store/BuyBar';

export const revalidate = 60;

export async function generateStaticParams() {
  const packs = await listCatalog({ kind: 'promptpack' });
  return packs.map((p) => ({ pack: p.slug }));
}

export default async function PackPage({ params }: { params: Promise<{ pack: string }> }) {
  const { pack } = await params;
  const item = await getCatalogItem(pack);
  if (!item) notFound();

  return (
    <main className="px-5 py-10">
      <article className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-extrabold leading-tight">{item.title}</h1>
        {item.short_description ? <p className="mt-3 text-lg text-ink-soft">{item.short_description}</p> : null}
        <div className="mt-6"><BuyBar item={item} /></div>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">Sample output</h2>
          {/* REPLACE: real before/after images generated from these prompts */}
          <p className="mt-2 text-ink-soft">Sample images go here once the pack is finished.</p>
        </section>

        <div className="mt-12"><BuyBar item={item} /></div>
      </article>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/app/promptkart
git commit -m "feat(web): add PromptKart listing and pack pages"
```

---

## Task 13: Three.js hero, fenced

Desktop only, lazy, never in the critical path.

**Files:**
- Create: `web/components/hero/HeroCanvas.tsx`
- Create: `web/components/hero/HeroBackdrop.tsx`
- Modify: `web/app/page.tsx`

**Interfaces:**
- Consumes: `prefersReducedMotion` (Task 7), `three`
- Produces: `<HeroBackdrop />` which renders a CSS gradient on mobile and mounts `HeroCanvas` on desktop

- [ ] **Step 1: Write the canvas**

Create `web/components/hero/HeroCanvas.tsx`:

```tsx
'use client';
import { useEffect, useRef } from 'react';

export default function HeroCanvas() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let stop = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import('three');
      if (stop || !el) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 100);
      camera.position.z = 3.2;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(el.clientWidth, el.clientHeight);
      el.appendChild(renderer.domElement);

      const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.15, 1),
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.22 })
      );
      scene.add(mesh);

      let frame = 0;
      const tick = () => {
        mesh.rotation.x += 0.0015;
        mesh.rotation.y += 0.0022;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);

      const onResize = () => {
        if (!el) return;
        camera.aspect = el.clientWidth / el.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(el.clientWidth, el.clientHeight);
      };
      addEventListener('resize', onResize);

      cleanup = () => {
        cancelAnimationFrame(frame);
        removeEventListener('resize', onResize);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => { stop = true; cleanup(); };
  }, []);

  return <div ref={host} className="absolute inset-0" aria-hidden="true" />;
}
```

- [ ] **Step 2: Write the fence**

Create `web/components/hero/HeroBackdrop.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { prefersReducedMotion } from '@/lib/motion/reveal';

const HeroCanvas = dynamic(() => import('./HeroCanvas'), { ssr: false });

export default function HeroBackdrop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Desktop, pointer-capable, motion allowed. Everyone else keeps the gradient.
    const desktop = matchMedia('(min-width: 1024px) and (pointer: fine)').matches;
    if (!desktop || prefersReducedMotion()) return;
    const id = requestIdleCallback ? requestIdleCallback(() => setShow(true)) : setTimeout(() => setShow(true), 1200);
    return () => { if (typeof id === 'number') clearTimeout(id); };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_10%,rgba(255,255,255,0.22),transparent_60%)]" />
      {show ? <HeroCanvas /> : null}
    </div>
  );
}
```

The gradient always renders, so the hero looks finished at first paint and the canvas layers on afterwards.

- [ ] **Step 3: Mount it in the hero**

In `web/app/page.tsx`, import `HeroBackdrop`, add `relative overflow-hidden` to the hero `<section>` classes, place `<HeroBackdrop />` as its first child, and wrap the existing inner `<div>` in `relative` so the text sits above the canvas.

- [ ] **Step 4: Confirm the fence holds**

```bash
npm --prefix web run build
```

Check the route summary. The homepage First Load JS must stay under 180KB. Three.js belongs to a separate lazy chunk, never the entry.

- [ ] **Step 5: Commit**

```bash
git add web/components/hero web/app/page.tsx
git commit -m "feat(web): add lazy desktop-only Three.js hero with gradient fallback"
```

---

## Task 14: Cutover

**Files:**
- Modify: `api/server.js`
- Create: `web/app/not-found.tsx`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Keep the legacy pages reachable but unlinked**

In `api/server.js`, the existing `express.static(path.join(__dirname, '..', 'public'))` line stays. Adjust the path if Task 1 changed the depth. Legacy tool URLs must still resolve so paying customers keep access.

- [ ] **Step 2: Verify a legacy tool still works**

```bash
curl -sI http://localhost:4000/tools/biodata | head -1
```

Expected: `HTTP/1.1 200 OK`

- [ ] **Step 3: Add the 404 page**

Create `web/app/not-found.tsx`:

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-5 py-20 text-center">
      <h1 className="font-display text-3xl font-extrabold">That page is gone</h1>
      <p className="mt-3 text-ink-soft">The link may be old, or the product may have been unpublished.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-white">
        Back to the store
      </Link>
    </main>
  );
}
```

- [ ] **Step 4: Add CI**

Create `.github/workflows/ci.yml`:

```yaml
name: ci
on: [push, pull_request]

jobs:
  api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '24' }
      - run: npm --prefix api ci
      - run: npm --prefix api test

  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '24' }
      - run: npm --prefix web ci
      - run: npm --prefix web test
      - run: npm --prefix web run build
```

- [ ] **Step 5: List everything still needing real content**

```bash
grep -rn "REPLACE:" web/app web/components || echo "nothing left to replace"
```

Hand the output to the site owner. These are the lines needing real data before launch.

- [ ] **Step 6: Commit**

```bash
git add api/server.js web/app/not-found.tsx .github/workflows/ci.yml
git commit -m "chore: cutover, keep legacy URLs alive, add CI"
```

---

## Self-Review

**Spec coverage**

| Spec section | Task |
|---|---|
| Architecture, repo split, ports | 1 |
| Data model, migration 010 | 2 |
| Catalog reads, leads capture | 3 |
| Next scaffold, shadcn, KokonutUI registry | 4 |
| Palette, type, reduced motion | 5 |
| Countdown from real `exam_date` | 6, 8 |
| Lenis, GSAP, reduced-motion safety | 7 |
| Home | 8 |
| Browse by class then subject | 9 |
| Product page, 20-page promise, chapters, FAQ | 10 |
| Checkout, order, Razorpay re-pointed | 11 |
| PromptKart | 12 |
| Three.js fenced, mobile gradient, 180KB budget | 13 |
| Legacy URLs alive, CI, REPLACE sweep | 14 |

**Known gaps, deliberately deferred**

- Free sample-chapter capture renders no UI yet. `POST /api/catalog/leads` exists from Task 3, so this is a component, not a backend change. Add it once a real `sample_pdf` exists.
- Admin fields for the Task 2 columns are not built. Seed rows by SQL until then.
- Lighthouse CI is not wired. Task 13 Step 4 checks the budget by hand at build time.
- Refund policy wording is still an open item in the spec.
