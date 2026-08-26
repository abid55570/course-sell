# Admin CMS Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Dropdesk catalog's source of truth from TypeScript files into Postgres, so an admin's edits reach the storefront and the advertised price can no longer differ from the charged price.

**Architecture:** A new `catalog_products` table holds queryable fields as real columns and all nested content in one `content` JSONB column. The API gains `GET /api/catalog/storefront` returning the catalog already shaped as the storefront's `Product`/`Bundle` types. `web/lib/catalog/index.ts` keeps its public accessor names but becomes async over one cached, tag-revalidated fetch. `orders` gains a nullable `catalog_product_id`, and `resolveProduct` charges from the same row the storefront rendered.

**Tech Stack:** Node 18+, Express, PostgreSQL (`pg`), Next.js 16 App Router, React 19, vitest (web), `node:test` (api).

**Spec:** `docs/superpowers/specs/2026-08-25-admin-cms-phase1-design.md`

## Global Constraints

- Migrations are idempotent: `IF NOT EXISTS` on tables/columns/indexes, `DO` block guards for constraints. Index names use the `idx_*` prefix.
- Migration files are applied in filename sort order by `api/scripts/migrate.js`; the new one is `011_catalog_products.sql`.
- API tests use `node:test` + `node:assert/strict`, run via `npm --prefix api test`.
- Web tests use vitest, run via `npm --prefix web test`.
- DB-backed API tests use the `withSchema` helper pattern from `api/tests/unit/catalog-schema.test.js` and skip when `TEST_DATABASE_URL`/`DATABASE_URL` is unset.
- `db` (`api/utils/db.js`) exposes `query`, `get`, `all`, `run`, `logTransaction`, `close`, `getPool`, `setPool`. Unit tests stub `db.get` by assignment, per `api/tests/unit/resolve-product.test.js`.
- Price is never read from a request body. It always comes from the database row.
- No AI attribution in commit messages.
- Do not modify `api/scripts/seed-catalog.js` in this phase — the `courses` mirror still serves the legacy payment path.

---

### Task 1: Migration — `catalog_products` table and order linkage

**Files:**
- Create: `api/migrations/011_catalog_products.sql`
- Create: `api/tests/unit/catalog-products-schema.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: table `catalog_products` with columns `id, slug, kind, title, short_title, tagline, price, anchor_price, category_slug, category_label, accent_name, accent_hex, tags, is_published, featured, available_today, pair_slug, set_slug, content, created_at, updated_at`; column `orders.catalog_product_id`; constraint `orders_product_ref_chk` asserting exactly one product reference.

- [ ] **Step 1: Write the failing test**

Create `api/tests/unit/catalog-products-schema.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const skipReason = !TEST_DATABASE_URL
  ? 'TEST_DATABASE_URL/DATABASE_URL not set; skipping pg-backed tests'
  : '';

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

test('011: catalog_products exists with the expected columns', { skip: skipReason }, async () => {
  await withSchema(async (c) => {
    const r = await c.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'catalog_products' AND table_schema = current_schema()`
    );
    const cols = r.rows.map((x) => x.column_name).sort();
    for (const expected of [
      'accent_hex', 'accent_name', 'anchor_price', 'available_today', 'category_label',
      'category_slug', 'content', 'created_at', 'featured', 'id', 'is_published', 'kind',
      'pair_slug', 'price', 'set_slug', 'short_title', 'slug', 'tagline', 'tags', 'title',
      'updated_at',
    ]) {
      assert.ok(cols.includes(expected), `missing column ${expected}`);
    }
  });
});

test('011: kind is constrained to product or bundle', { skip: skipReason }, async () => {
  await withSchema(async (c) => {
    await c.query(
      `INSERT INTO catalog_products (slug, kind, title, tagline, price)
       VALUES ('a', 'product', 'A', 't', 499)`
    );
    await assert.rejects(
      () => c.query(
        `INSERT INTO catalog_products (slug, kind, title, tagline, price)
         VALUES ('b', 'nonsense', 'B', 't', 499)`
      ),
      /violates check constraint/
    );
  });
});

test('011: slug is unique', { skip: skipReason }, async () => {
  await withSchema(async (c) => {
    await c.query(
      `INSERT INTO catalog_products (slug, title, tagline, price)
       VALUES ('dup', 'A', 't', 499)`
    );
    await assert.rejects(
      () => c.query(
        `INSERT INTO catalog_products (slug, title, tagline, price)
         VALUES ('dup', 'B', 't', 499)`
      ),
      /duplicate key value/
    );
  });
});

test('011: an order must reference exactly one product', { skip: skipReason }, async () => {
  await withSchema(async (c) => {
    const cat = await c.query(
      `INSERT INTO catalog_products (slug, title, tagline, price)
       VALUES ('glow-up-os', 'Glow-Up OS', 't', 499) RETURNING id`
    );
    const course = await c.query(
      `INSERT INTO courses (slug, title, original_price, discounted_price)
       VALUES ('legacy', 'Legacy', 999, 999) RETURNING id`
    );

    // exactly one -> accepted
    await c.query(
      `INSERT INTO orders (order_id, catalog_product_id, buyer_name, buyer_email, amount)
       VALUES ('ORD-1', $1, 'A', 'a@example.com', 499)`,
      [cat.rows[0].id]
    );

    // two references -> rejected
    await assert.rejects(
      () => c.query(
        `INSERT INTO orders (order_id, catalog_product_id, course_id, buyer_name, buyer_email, amount)
         VALUES ('ORD-2', $1, $2, 'A', 'a@example.com', 499)`,
        [cat.rows[0].id, course.rows[0].id]
      ),
      /orders_product_ref_chk/
    );

    // zero references -> rejected
    await assert.rejects(
      () => c.query(
        `INSERT INTO orders (order_id, buyer_name, buyer_email, amount)
         VALUES ('ORD-3', 'A', 'a@example.com', 499)`
      ),
      /orders_product_ref_chk/
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix api test -- --test-name-pattern="011:"`
Expected: FAIL — `relation "catalog_products" does not exist`. (If it reports all four tests skipped, Postgres is unreachable; start it with `docker compose up -d db` and re-run, or accept skip and rely on Task 3's live migration run for verification.)

- [ ] **Step 3: Write the migration**

Create `api/migrations/011_catalog_products.sql`:

```sql
-- =========================================================================
-- Storefront catalog. Replaces web/lib/catalog/*.ts as the source of truth
-- for the products and bundles the storefront renders. Queryable fields are
-- real columns; the nested content a product page renders as a whole
-- (modules, sections, FAQs, gallery, helplines) lives in one JSONB blob,
-- because nothing ever filters inside it.
--
-- Products and bundles share this table, separated by `kind`. Their shared
-- fields dominate, and one table means one accessor path in the storefront
-- and one foreign key for `orders` to point at.
-- =========================================================================

CREATE TABLE IF NOT EXISTS catalog_products (
  id              BIGSERIAL PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  kind            TEXT NOT NULL DEFAULT 'product'
                  CHECK (kind IN ('product','bundle')),
  title           TEXT NOT NULL,
  short_title     TEXT,
  tagline         TEXT NOT NULL,
  price           NUMERIC(10,2) NOT NULL,
  anchor_price    NUMERIC(10,2),
  category_slug   TEXT,
  category_label  TEXT,
  accent_name     TEXT,
  accent_hex      TEXT,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  featured        BOOLEAN NOT NULL DEFAULT FALSE,
  available_today BOOLEAN NOT NULL DEFAULT TRUE,
  pair_slug       TEXT,
  set_slug        TEXT,
  content         JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_slug ON catalog_products(slug);
CREATE INDEX IF NOT EXISTS idx_catalog_kind_published ON catalog_products(kind, is_published);
CREATE INDEX IF NOT EXISTS idx_catalog_category ON catalog_products(category_slug);

-- ----- orders can now reference a catalog product ------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS catalog_product_id
  BIGINT REFERENCES catalog_products(id);
CREATE INDEX IF NOT EXISTS idx_orders_catalog_product ON orders(catalog_product_id);

-- Migration 003 added orders_product_ref_chk as "course_id OR
-- video_project_id". Adding a third reference column means replacing that
-- constraint, not extending it. While replacing it, tighten "at least one"
-- to "exactly one": an order pointing at two products has no defined price
-- and no defined fulfilment path.
--
-- Refuse to tighten silently over data that would violate it. A migration
-- that drops a guard and fails to re-add it leaves the table permanently
-- unguarded, so this raises instead, naming the offending orders.
DO $$
DECLARE
  bad TEXT;
BEGIN
  SELECT string_agg(order_id, ', ') INTO bad
  FROM orders
  WHERE (course_id IS NOT NULL)::int
      + (video_project_id IS NOT NULL)::int
      + (catalog_product_id IS NOT NULL)::int <> 1;

  IF bad IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot tighten orders_product_ref_chk: these orders do not reference exactly one product: %', bad;
  END IF;

  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_ref_chk;
  ALTER TABLE orders ADD CONSTRAINT orders_product_ref_chk CHECK (
    (course_id IS NOT NULL)::int
  + (video_project_id IS NOT NULL)::int
  + (catalog_product_id IS NOT NULL)::int = 1
  );
END$$;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm --prefix api test -- --test-name-pattern="011:"`
Expected: PASS (4 tests), or all skipped if no database is reachable.

- [ ] **Step 5: Verify the migration applies to the real database**

Run: `npm --prefix api run migrate`
Expected: `011_catalog_products` applied, no error. Re-run it; expected `skip 011_catalog_products (already applied)`.

- [ ] **Step 6: Commit**

```bash
git add api/migrations/011_catalog_products.sql api/tests/unit/catalog-products-schema.test.js
git commit -m "Add catalog_products, and let an order point at one"
```

---

### Task 2: Full-fidelity catalog export

**Files:**
- Modify: `web/scripts/export-catalog.js` (add a `--full` mode; keep default output byte-identical)
- Create: `web/tests/export-catalog-full.test.ts`

**Interfaces:**
- Consumes: `web/lib/catalog` (via the script's existing `require.extensions` TypeScript hook).
- Produces: `node web/scripts/export-catalog.js --full` prints `{ products: Product[], bundles: Bundle[] }` with every field of each type preserved verbatim, including bundles where `availableToday` is false.

- [ ] **Step 1: Write the failing test**

Create `web/tests/export-catalog-full.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { listProducts, listBundles } from '@/lib/catalog';

function runExport(args: string[]): { products: unknown[]; bundles: unknown[] } {
  const script = path.join(process.cwd(), 'scripts', 'export-catalog.js');
  const out = execFileSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  return JSON.parse(out);
}

describe('export-catalog --full', () => {
  it('exports every product and every bundle, including unavailable ones', () => {
    const full = runExport(['--full']);
    expect(full.products).toHaveLength(listProducts().length);
    expect(full.bundles).toHaveLength(listBundles().length);
  });

  it('preserves each product verbatim, losing no field', () => {
    const full = runExport(['--full']) as { products: Array<Record<string, unknown>> };
    const bySlug = new Map(full.products.map((p) => [p.slug as string, p]));
    for (const product of listProducts()) {
      expect(bySlug.get(product.slug)).toEqual(JSON.parse(JSON.stringify(product)));
    }
  });

  it('preserves each bundle verbatim, including inCatalog:false components', () => {
    const full = runExport(['--full']) as { bundles: Array<Record<string, unknown>> };
    const bySlug = new Map(full.bundles.map((b) => [b.slug as string, b]));
    for (const bundle of listBundles()) {
      expect(bySlug.get(bundle.slug)).toEqual(JSON.parse(JSON.stringify(bundle)));
    }
  });

  it('leaves the default (seed) output unchanged', () => {
    const seed = runExport([]) as { products: Array<Record<string, unknown>> };
    expect(Object.keys(seed.products[0]).sort()).toEqual(
      ['category', 'description', 'price', 'slug', 'tagline', 'title'].sort()
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web test -- export-catalog-full`
Expected: FAIL — `--full` is ignored, so the full export returns the six trimmed fields and the verbatim comparison fails.

- [ ] **Step 3: Implement `--full`**

In `web/scripts/export-catalog.js`, leave `mapProduct`/`mapBundle` and the existing default output untouched. Replace the final output block:

```js
const products = catalog.listProducts().map(mapProduct);
const bundles = catalog
  .listBundles()
  .filter((b) => b.availableToday === true)
  .map(mapBundle);

process.stdout.write(JSON.stringify({ products, bundles }, null, 2));
```

with:

```js
// Two consumers, two shapes.
//
// Default: the trimmed six-field rows api/scripts/seed-catalog.js writes into
// the `courses` mirror the legacy payment path still reads. Unchanged.
//
// --full: every field of Product and Bundle, verbatim, for
// api/scripts/migrate-catalog.js to load into catalog_products. Unavailable
// bundles are included here — the storefront renders them as "coming soon"
// rather than hiding them, so the database has to hold them.
const full = process.argv.includes('--full');

if (full) {
  process.stdout.write(
    JSON.stringify(
      { products: catalog.listProducts(), bundles: catalog.listBundles() },
      null,
      2
    )
  );
} else {
  const products = catalog.listProducts().map(mapProduct);
  const bundles = catalog
    .listBundles()
    .filter((b) => b.availableToday === true)
    .map(mapBundle);
  process.stdout.write(JSON.stringify({ products, bundles }, null, 2));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm --prefix web test -- export-catalog-full`
Expected: PASS (4 tests).

- [ ] **Step 5: Confirm the seed path still works**

Run: `node web/scripts/export-catalog.js | head -20`
Expected: unchanged trimmed output, 84 products and 2 bundles.

- [ ] **Step 6: Commit**

```bash
git add web/scripts/export-catalog.js web/tests/export-catalog-full.test.ts
git commit -m "Export the catalog in full, not just the fields the mirror needs"
```

---

### Task 3: Migrate the catalog into `catalog_products`

**Files:**
- Create: `api/scripts/migrate-catalog.js`
- Create: `api/tests/unit/migrate-catalog.test.js`
- Modify: `api/package.json` (add the `migrate:catalog` script)

**Interfaces:**
- Consumes: `node web/scripts/export-catalog.js --full`; table `catalog_products` from Task 1.
- Produces: `api/scripts/migrate-catalog.js` exporting `{ splitRow }`, where `splitRow(item, kind)` returns `{ columns, content }`. `columns` holds the real-column values; `content` holds everything else. Also `npm --prefix api run migrate:catalog`.

- [ ] **Step 1: Write the failing test**

Create `api/tests/unit/migrate-catalog.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { splitRow } = require('../../scripts/migrate-catalog');

const PRODUCT = {
  slug: 'glow-up-os',
  title: 'Glow-Up OS',
  shortTitle: 'Glow-Up',
  tagline: 'Body, looks, mind.',
  price: 999,
  anchorPrice: 2999,
  category: { slug: 'self', label: 'Self', accent: { name: 'green', hex: '#1f8a4c' } },
  accent: { name: 'gold', hex: '#c8a44a' },
  tags: ['glow', 'habits'],
  featured: true,
  pairSlug: 'social-os',
  setSlug: undefined,
  modules: [{ id: '01', title: 'BODY', pageCount: 12, highlights: ['a'] }],
  longDescription: [{ heading: 'What', paragraphs: ['p1', 'p2'] }],
  bulletPoints: ['b1'],
  faqs: [{ question: 'q', answer: 'a' }],
  gallery: [{ filename: 'cover.png', role: 'cover', alt: 'Cover' }],
  deliveryFiles: ['glow-up-os.pdf'],
  disclaimer: 'Not medical advice.',
  pageCount: 39,
};

test('splitRow: scalars go to columns', () => {
  const { columns } = splitRow(PRODUCT, 'product');
  assert.equal(columns.slug, 'glow-up-os');
  assert.equal(columns.kind, 'product');
  assert.equal(columns.title, 'Glow-Up OS');
  assert.equal(columns.short_title, 'Glow-Up');
  assert.equal(columns.tagline, 'Body, looks, mind.');
  assert.equal(columns.price, 999);
  assert.equal(columns.anchor_price, 2999);
  assert.equal(columns.category_slug, 'self');
  assert.equal(columns.category_label, 'Self');
  assert.equal(columns.accent_name, 'gold');
  assert.equal(columns.accent_hex, '#c8a44a');
  assert.deepEqual(columns.tags, ['glow', 'habits']);
  assert.equal(columns.featured, true);
  assert.equal(columns.pair_slug, 'social-os');
  assert.equal(columns.set_slug, null);
});

test('splitRow: nested content goes to content, not columns', () => {
  const { content, columns } = splitRow(PRODUCT, 'product');
  assert.deepEqual(content.modules, PRODUCT.modules);
  assert.deepEqual(content.longDescription, PRODUCT.longDescription);
  assert.deepEqual(content.faqs, PRODUCT.faqs);
  assert.deepEqual(content.gallery, PRODUCT.gallery);
  assert.equal(content.disclaimer, 'Not medical advice.');
  assert.equal(content.pageCount, 39);
  // Anything promoted to a column must not be duplicated in content.
  for (const promoted of ['slug', 'title', 'tagline', 'price', 'tags', 'category', 'accent']) {
    assert.ok(!(promoted in content), `${promoted} should not be in content`);
  }
});

test('splitRow: a bundle keeps components and availableToday', () => {
  const bundle = {
    slug: 'everything-bundle',
    title: 'Everything',
    tagline: 'All six.',
    price: 2999,
    separatePrice: 5994,
    availableToday: true,
    components: [
      { slug: 'glow-up-os', label: 'Glow-Up OS', inCatalog: true },
      { slug: null, label: 'Skin OS', inCatalog: false, note: 'not built yet' },
    ],
    longDescription: [],
    disclaimer: 'x',
    helplines: [],
    faqs: [],
    coverImage: { filename: 'c.png', role: 'cover', alt: 'c' },
  };
  const { columns, content } = splitRow(bundle, 'bundle');
  assert.equal(columns.kind, 'bundle');
  assert.equal(columns.available_today, true);
  assert.deepEqual(content.components, bundle.components);
  assert.equal(content.separatePrice, 5994);
});

test('splitRow: a product with no optional fields produces nulls, not undefined', () => {
  const bare = { slug: 's', title: 'T', tagline: 'g', price: 499, tags: [], gallery: [], faqs: [], bulletPoints: [], longDescription: [], deliveryFiles: [] };
  const { columns } = splitRow(bare, 'product');
  assert.equal(columns.short_title, null);
  assert.equal(columns.anchor_price, null);
  assert.equal(columns.pair_slug, null);
  assert.equal(columns.category_slug, null);
  assert.equal(columns.accent_name, null);
  assert.equal(columns.featured, false);
  assert.equal(columns.available_today, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix api test -- --test-name-pattern="splitRow"`
Expected: FAIL — `Cannot find module '../../scripts/migrate-catalog'`.

- [ ] **Step 3: Write the migration script**

Create `api/scripts/migrate-catalog.js`:

```js
#!/usr/bin/env node
/**
 * Loads the storefront catalog into `catalog_products`.
 *
 * Input is `node web/scripts/export-catalog.js --full`, which re-derives every
 * field from the TypeScript catalog at run time, so this script never holds a
 * hand-copied second version of the product data.
 *
 * Idempotent: upserts by slug. Safe to re-run.
 *
 * It deliberately does NOT own `is_published`. That is an operator decision
 * made in the admin panel, and re-running a content sync must not silently
 * put a withdrawn product back on sale — the same reasoning
 * scripts/seed-catalog.js applies to its own price columns.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { execFileSync } = require('child_process');
const db = require('../utils/db');

/** Fields promoted to real columns, and therefore not repeated in `content`. */
const PROMOTED = new Set([
  'slug', 'title', 'shortTitle', 'tagline', 'price', 'anchorPrice',
  'category', 'accent', 'tags', 'featured', 'availableToday',
  'pairSlug', 'setSlug',
]);

/**
 * Split one catalog item into real-column values and the JSONB remainder.
 * @param {object} item a Product or Bundle from the full export
 * @param {'product'|'bundle'} kind
 */
function splitRow(item, kind) {
  const columns = {
    slug: item.slug,
    kind,
    title: item.title,
    short_title: item.shortTitle ?? null,
    tagline: item.tagline,
    price: item.price,
    anchor_price: item.anchorPrice ?? null,
    category_slug: item.category?.slug ?? null,
    category_label: item.category?.label ?? null,
    accent_name: item.accent?.name ?? null,
    accent_hex: item.accent?.hex ?? null,
    tags: item.tags ?? [],
    featured: item.featured === true,
    available_today: item.availableToday !== false,
    pair_slug: item.pairSlug ?? null,
    set_slug: item.setSlug ?? null,
  };

  const content = {};
  for (const [key, value] of Object.entries(item)) {
    if (PROMOTED.has(key)) continue;
    if (value === undefined) continue;
    content[key] = value;
  }

  return { columns, content };
}

async function upsert(item, kind) {
  const { columns, content } = splitRow(item, kind);
  const existing = await db.get('SELECT id FROM catalog_products WHERE slug = $1', [columns.slug]);
  const values = [
    columns.slug, columns.kind, columns.title, columns.short_title, columns.tagline,
    columns.price, columns.anchor_price, columns.category_slug, columns.category_label,
    columns.accent_name, columns.accent_hex, columns.tags, columns.featured,
    columns.available_today, columns.pair_slug, columns.set_slug,
    JSON.stringify(content),
  ];

  if (existing) {
    await db.run(
      `UPDATE catalog_products SET
         kind=$2, title=$3, short_title=$4, tagline=$5, price=$6, anchor_price=$7,
         category_slug=$8, category_label=$9, accent_name=$10, accent_hex=$11,
         tags=$12, featured=$13, available_today=$14, pair_slug=$15, set_slug=$16,
         content=$17::jsonb, updated_at=NOW()
       WHERE slug=$1`,
      values
    );
    return 'updated';
  }

  await db.run(
    `INSERT INTO catalog_products
       (slug, kind, title, short_title, tagline, price, anchor_price,
        category_slug, category_label, accent_name, accent_hex, tags,
        featured, available_today, pair_slug, set_slug, content)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb)`,
    values
  );
  return 'inserted';
}

async function main() {
  const script = path.join(__dirname, '..', '..', 'web', 'scripts', 'export-catalog.js');
  const raw = execFileSync(process.execPath, [script, '--full'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const { products, bundles } = JSON.parse(raw);

  let inserted = 0;
  let updated = 0;
  for (const p of products) {
    (await upsert(p, 'product')) === 'inserted' ? inserted++ : updated++;
  }
  for (const b of bundles) {
    (await upsert(b, 'bundle')) === 'inserted' ? inserted++ : updated++;
  }

  console.log(`catalog_products: ${inserted} inserted, ${updated} updated`);
  await db.close();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

module.exports = { splitRow, upsert };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm --prefix api test -- --test-name-pattern="splitRow"`
Expected: PASS (4 tests).

- [ ] **Step 5: Add the npm script**

In `api/package.json`, after the `"seed:catalog"` line, add:

```json
    "migrate:catalog": "node scripts/migrate-catalog.js",
```

- [ ] **Step 6: Run it against the real database, twice**

Run: `npm --prefix api run migrate:catalog`
Expected: `catalog_products: 90 inserted, 0 updated` (84 products + 6 bundles).

Run it again.
Expected: `catalog_products: 0 inserted, 90 updated` — proving idempotency.

Verify: `psql "$DATABASE_URL" -c "SELECT kind, count(*) FROM catalog_products GROUP BY kind"`
Expected: `product | 84` and `bundle | 6`.

- [ ] **Step 7: Commit**

```bash
git add api/scripts/migrate-catalog.js api/tests/unit/migrate-catalog.test.js api/package.json
git commit -m "Load the catalog into the database"
```

---

### Task 4: `GET /api/catalog/storefront`

**Files:**
- Create: `api/routes/catalog-storefront.js`
- Create: `api/tests/unit/catalog-storefront.test.js`
- Modify: `api/server.js` (mount the route)

**Interfaces:**
- Consumes: table `catalog_products`.
- Produces: `GET /api/catalog/storefront` returning `{ products: Product[], bundles: Bundle[] }`; module exports `{ router, shapeRow }` where `shapeRow(row)` returns a `Product`/`Bundle` object or `null` for an unusable row.

- [ ] **Step 1: Write the failing test**

Create `api/tests/unit/catalog-storefront.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { shapeRow } = require('../../routes/catalog-storefront');

const ROW = {
  id: 1,
  slug: 'glow-up-os',
  kind: 'product',
  title: 'Glow-Up OS',
  short_title: 'Glow-Up',
  tagline: 'Body, looks, mind.',
  price: '999.00',
  anchor_price: '2999.00',
  category_slug: 'self',
  category_label: 'Self',
  accent_name: 'gold',
  accent_hex: '#c8a44a',
  tags: ['glow'],
  is_published: true,
  featured: true,
  available_today: true,
  pair_slug: 'social-os',
  set_slug: null,
  content: {
    modules: [{ id: '01', title: 'BODY', pageCount: 12, highlights: ['a'] }],
    longDescription: [{ heading: 'What', paragraphs: ['p'] }],
    faqs: [{ question: 'q', answer: 'a' }],
    gallery: [{ filename: 'c.png', role: 'cover', alt: 'c' }],
    bulletPoints: ['b'],
    deliveryFiles: ['x.pdf'],
    disclaimer: 'Not medical advice.',
    pageCount: 39,
  },
};

test('shapeRow: rebuilds the nested category and accent objects', () => {
  const p = shapeRow(ROW);
  assert.deepEqual(p.category, { slug: 'self', label: 'Self', accent: { name: 'gold', hex: '#c8a44a' } });
  assert.deepEqual(p.accent, { name: 'gold', hex: '#c8a44a' });
});

test('shapeRow: numeric columns come back as numbers, not strings', () => {
  const p = shapeRow(ROW);
  assert.equal(p.price, 999);
  assert.equal(p.anchorPrice, 2999);
  assert.equal(typeof p.price, 'number');
});

test('shapeRow: content is merged in at the top level', () => {
  const p = shapeRow(ROW);
  assert.deepEqual(p.modules, ROW.content.modules);
  assert.deepEqual(p.faqs, ROW.content.faqs);
  assert.equal(p.disclaimer, 'Not medical advice.');
  assert.equal(p.pageCount, 39);
});

test('shapeRow: camelCase names the storefront types declare', () => {
  const p = shapeRow(ROW);
  assert.equal(p.shortTitle, 'Glow-Up');
  assert.equal(p.pairSlug, 'social-os');
  assert.equal(p.setSlug, undefined);
  assert.equal(p.featured, true);
});

test('shapeRow: a bundle keeps components, separatePrice and availableToday', () => {
  const b = shapeRow({
    ...ROW,
    slug: 'everything-bundle',
    kind: 'bundle',
    available_today: false,
    content: {
      components: [{ slug: null, label: 'Skin OS', inCatalog: false, note: 'n' }],
      separatePrice: 5994,
      longDescription: [],
      faqs: [],
      helplines: [],
      disclaimer: 'x',
      coverImage: { filename: 'c.png', role: 'cover', alt: 'c' },
    },
  });
  assert.equal(b.availableToday, false);
  assert.equal(b.separatePrice, 5994);
  assert.equal(b.components.length, 1);
});

test('shapeRow: a row missing a required field is rejected, not half-shaped', () => {
  assert.equal(shapeRow({ ...ROW, title: null }), null);
  assert.equal(shapeRow({ ...ROW, slug: null }), null);
  assert.equal(shapeRow({ ...ROW, price: null }), null);
});

test('shapeRow: a row with unusable content JSONB is rejected', () => {
  assert.equal(shapeRow({ ...ROW, content: null }), null);
  assert.equal(shapeRow({ ...ROW, content: 'not an object' }), null);
});

test('shapeRow: absent optional collections become empty arrays, never undefined', () => {
  const p = shapeRow({ ...ROW, content: {} });
  assert.deepEqual(p.faqs, []);
  assert.deepEqual(p.gallery, []);
  assert.deepEqual(p.bulletPoints, []);
  assert.deepEqual(p.longDescription, []);
  assert.deepEqual(p.deliveryFiles, []);
  assert.equal(p.modules, undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix api test -- --test-name-pattern="shapeRow"`
Expected: FAIL — `Cannot find module '../../routes/catalog-storefront'`.

- [ ] **Step 3: Write the route**

Create `api/routes/catalog-storefront.js`:

```js
/**
 * The storefront's catalog feed.
 *
 * Returns catalog_products already shaped as web/lib/catalog's `Product` and
 * `Bundle` types, so the Next.js app can swap its file-based catalog for this
 * without reshaping anything at the call site.
 *
 * Separate from routes/catalog.js, which serves a different, older store
 * shape (board/class_level/subject over `courses`) that other callers still
 * depend on.
 */
const express = require('express');
const db = require('../utils/db');

const router = express.Router();

function num(value) {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Turn one database row into a Product or Bundle.
 * Returns null when the row cannot be shaped — a single bad row must not take
 * down the whole listing, so the caller skips it and logs the slug.
 */
function shapeRow(row) {
  if (!row || !row.slug || !row.title) return null;
  const price = num(row.price);
  if (price === undefined) return null;
  if (!row.content || typeof row.content !== 'object' || Array.isArray(row.content)) return null;

  const content = row.content;
  const accent = row.accent_name && row.accent_hex
    ? { name: row.accent_name, hex: row.accent_hex }
    : undefined;

  const shaped = {
    slug: row.slug,
    title: row.title,
    tagline: row.tagline ?? '',
    price,
    tags: row.tags ?? [],
    // Collections the storefront maps over unconditionally.
    longDescription: content.longDescription ?? [],
    bulletPoints: content.bulletPoints ?? [],
    faqs: content.faqs ?? [],
    gallery: content.gallery ?? [],
    deliveryFiles: content.deliveryFiles ?? [],
    ...content,
  };

  // Columns win over content: they are what the admin edits and what the
  // charge is computed from.
  shaped.longDescription = content.longDescription ?? [];
  shaped.bulletPoints = content.bulletPoints ?? [];
  shaped.faqs = content.faqs ?? [];
  shaped.gallery = content.gallery ?? [];
  shaped.deliveryFiles = content.deliveryFiles ?? [];
  shaped.slug = row.slug;
  shaped.title = row.title;
  shaped.tagline = row.tagline ?? '';
  shaped.price = price;
  shaped.tags = row.tags ?? [];

  if (row.short_title) shaped.shortTitle = row.short_title;
  const anchor = num(row.anchor_price);
  if (anchor !== undefined) shaped.anchorPrice = anchor;
  if (accent) shaped.accent = accent;
  if (row.category_slug) {
    shaped.category = {
      slug: row.category_slug,
      label: row.category_label ?? row.category_slug,
      accent: accent ?? { name: 'green', hex: '#1f8a4c' },
    };
  }
  if (row.featured === true) shaped.featured = true;
  if (row.pair_slug) shaped.pairSlug = row.pair_slug;
  if (row.set_slug) shaped.setSlug = row.set_slug;
  if (row.kind === 'bundle') shaped.availableToday = row.available_today !== false;

  return shaped;
}

router.get('/', async (req, res, next) => {
  try {
    const rows = await db.all(
      `SELECT id, slug, kind, title, short_title, tagline, price, anchor_price,
              category_slug, category_label, accent_name, accent_hex, tags,
              is_published, featured, available_today, pair_slug, set_slug, content
         FROM catalog_products
        WHERE is_published = TRUE
        ORDER BY kind, id`,
      []
    );

    const products = [];
    const bundles = [];
    for (const row of rows) {
      const shaped = shapeRow(row);
      if (!shaped) {
        console.warn('[catalog/storefront] skipping unusable row', row && row.slug);
        continue;
      }
      (row.kind === 'bundle' ? bundles : products).push(shaped);
    }

    res.json({ products, bundles });
  } catch (e) { next(e); }
});

module.exports = router;
module.exports.router = router;
module.exports.shapeRow = shapeRow;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm --prefix api test -- --test-name-pattern="shapeRow"`
Expected: PASS (8 tests).

- [ ] **Step 5: Mount the route**

In `api/server.js`, immediately after the existing `app.use('/api/catalog', ...)` line, add:

```js
app.use('/api/catalog/storefront', require('./routes/catalog-storefront'));
```

Mount order matters: Express matches the more specific path first only if it is registered first, so this line must come **before** `/api/catalog`. Move it above if needed.

- [ ] **Step 6: Verify against the running API**

Run: `npm --prefix api start` in one shell, then:
`curl -s localhost:4000/api/catalog/storefront | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(d.products.length,'products',d.bundles.length,'bundles')"`
Expected: `84 products 6 bundles`.

- [ ] **Step 7: Commit**

```bash
git add api/routes/catalog-storefront.js api/tests/unit/catalog-storefront.test.js api/server.js
git commit -m "Serve the catalog in the shape the storefront reads"
```

---

### Task 5: Charge from the row the storefront rendered

**Files:**
- Modify: `api/routes/orders.js` (`resolveProduct`, and the INSERT that records the order)
- Modify: `api/tests/unit/resolve-product.test.js` (add cases)

**Interfaces:**
- Consumes: table `catalog_products`; `orders.catalog_product_id` from Task 1.
- Produces: `resolveProduct` returns `{ productType: 'catalog', catalogProductId, amount, title, catalogProduct }` for a catalog slug, still `{ courseId, ... }` for legacy courses and tools.

- [ ] **Step 1: Write the failing test**

Append to `api/tests/unit/resolve-product.test.js`:

```js
test('resolveProduct: a catalog slug resolves from catalog_products, not courses', async () => {
  const restore = stubDbGet(async (sql, params) => {
    if (/FROM catalog_products/.test(sql)) {
      assert.deepEqual(params, ['glow-up-os']);
      return { id: 7, slug: 'glow-up-os', title: 'Glow-Up OS', price: '999.00', kind: 'product' };
    }
    return null;
  });
  try {
    const r = await resolveProduct({ course_slug: 'glow-up-os' });
    assert.equal(r.productType, 'catalog');
    assert.equal(r.catalogProductId, 7);
    assert.equal(r.amount, 999);
    assert.equal(r.title, 'Glow-Up OS');
    assert.equal(r.courseId, undefined);
  } finally { restore(); }
});

test('resolveProduct: the charged amount equals the catalog price exactly', async () => {
  const restore = stubDbGet(async (sql) => {
    if (/FROM catalog_products/.test(sql)) {
      return { id: 7, slug: 'x', title: 'X', price: '1499.50', kind: 'product' };
    }
    return null;
  });
  try {
    const r = await resolveProduct({ course_slug: 'x' });
    assert.equal(r.amount, 1499.5);
  } finally { restore(); }
});

test('resolveProduct: catalog_products is preferred over a stale courses mirror row', async () => {
  const restore = stubDbGet(async (sql) => {
    if (/FROM catalog_products/.test(sql)) {
      return { id: 7, slug: 'x', title: 'New Title', price: '499.00', kind: 'product' };
    }
    // A stale mirror row that would have charged the old price.
    return { id: 99, slug: 'x', title: 'Old Title', discounted_price: '999.00' };
  });
  try {
    const r = await resolveProduct({ course_slug: 'x' });
    assert.equal(r.amount, 499);
    assert.equal(r.title, 'New Title');
  } finally { restore(); }
});

test('resolveProduct: an unknown slug is still an error', async () => {
  const restore = stubDbGet(async () => null);
  try {
    const r = await resolveProduct({ course_slug: 'nope' });
    assert.match(r.error, /not found/);
  } finally { restore(); }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix api test -- --test-name-pattern="resolveProduct"`
Expected: FAIL — the new cases get `productType: 'course'` and `courseId: 99`, because nothing queries `catalog_products` yet.

- [ ] **Step 3: Implement the branch**

In `api/routes/orders.js`, replace the whole `if (course_slug) { ... }` block with:

```js
  // A storefront slug. Look in catalog_products first: that is the row the
  // storefront rendered, so charging from anywhere else is how an advertised
  // price and a charged price drift apart. Price always comes from this row,
  // never from the request body.
  if (course_slug) {
    const item = await db.get(
      'SELECT id, slug, kind, title, price FROM catalog_products WHERE slug = $1 AND is_published = TRUE',
      [course_slug]
    );
    if (item) {
      const amount = Number(item.price) || 0;
      return {
        productType: 'catalog',
        catalogProductId: item.id,
        amount,
        title: item.title,
        catalogProduct: item,
      };
    }

    // Fall back to the `courses` mirror for the legacy product lines that
    // are not in catalog_products (tools, the carousel editor, courses).
    const course = await db.get('SELECT * FROM courses WHERE slug = $1 AND is_published = TRUE', [course_slug]);
    if (!course) return { error: 'product not found' };
    const amount = Number(course.discounted_price) || Number(course.original_price) || 0;
    let productType = 'course';
    if (course.slug === 'carousel-editor') productType = 'carousel';
    else if (isToolKey(course.slug)) productType = course.slug;
    return { productType, courseId: course.id, amount, title: course.title, course };
  }
```

- [ ] **Step 4: Record the new reference on the order**

Still in `api/routes/orders.js`, find the INSERT that creates the order (it lists `course_id, video_project_id`) and add the new column. Replace:

```js
      `INSERT INTO orders (order_id, product_type, course_id, video_project_id, buyer_name, buyer_email, buyer_phone, amount, status)
```

with:

```js
      `INSERT INTO orders (order_id, product_type, course_id, video_project_id, catalog_product_id, buyer_name, buyer_email, buyer_phone, amount, status)
```

and update the `VALUES` placeholder list and the parameter array to pass `product.catalogProductId || null` in the new position. The exactly-one CHECK from Task 1 will reject any order that sets two references, so run the suite after this edit rather than assuming.

- [ ] **Step 5: Run the full api suite**

Run: `npm --prefix api test`
Expected: PASS, including the pre-existing `resolveProduct` course/video/tool cases.

- [ ] **Step 6: Commit**

```bash
git add api/routes/orders.js api/tests/unit/resolve-product.test.js
git commit -m "Charge the price the storefront showed"
```

---

### Task 6: The storefront reads the database

**Files:**
- Create: `web/lib/catalog/loader.ts`
- Create: `web/lib/support.ts`
- Modify: `web/lib/catalog/index.ts` (accessors become async)
- Modify: `web/app/order/[id]/page.tsx` (import `SUPPORT_EMAIL` from the new module)
- Create: `web/tests/catalog-loader.test.ts`

**Interfaces:**
- Consumes: `GET /api/catalog/storefront` from Task 4; `PUBLIC_API_BASE`/`API_BASE` from `web/lib/env.ts`.
- Produces: `loadCatalog(): Promise<{ products: Product[]; bundles: Bundle[] }>`; all 12 accessors in `index.ts` return promises; `getPricingLadder(): Promise<{ single: number; pair: number; allSix: number }>` replaces the `PRICING_LADDER` const; `SUPPORT_EMAIL` re-exported from `web/lib/support.ts`.

- [ ] **Step 1: Write the failing test**

Create `web/tests/catalog-loader.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const FIXTURE = {
  products: [
    { slug: 'a', title: 'A', tagline: 'ta', price: 499, tags: [], longDescription: [], bulletPoints: [], faqs: [], gallery: [], deliveryFiles: [], category: { slug: 'c', label: 'C', accent: { name: 'green', hex: '#1f8a4c' } }, accent: { name: 'green', hex: '#1f8a4c' }, featured: true },
    { slug: 'b', title: 'B', tagline: 'tb', price: 999, tags: [], longDescription: [], bulletPoints: [], faqs: [], gallery: [], deliveryFiles: [], category: { slug: 'c', label: 'C', accent: { name: 'green', hex: '#1f8a4c' } }, accent: { name: 'green', hex: '#1f8a4c' } },
  ],
  bundles: [
    { slug: 'the-complete-man', title: 'CM', tagline: 't', price: 1499, longDescription: [], disclaimer: '', helplines: [], components: [], coverImage: { filename: 'c.png', role: 'cover', alt: 'c' }, availableToday: true, faqs: [] },
    { slug: 'everything-bundle', title: 'EB', tagline: 't', price: 2999, longDescription: [], disclaimer: '', helplines: [], components: [], coverImage: { filename: 'c.png', role: 'cover', alt: 'c' }, availableToday: true, faqs: [] },
  ],
};

describe('loadCatalog', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(FIXTURE), {
      status: 200, headers: { 'content-type': 'application/json' },
    })));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

  it('fetches the storefront endpoint', async () => {
    const { loadCatalog } = await import('@/lib/catalog/loader');
    const catalog = await loadCatalog();
    expect(catalog.products).toHaveLength(2);
    expect(catalog.bundles).toHaveLength(2);
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('/api/catalog/storefront');
  });

  it('throws loudly on a non-OK response rather than returning an empty store', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    const { loadCatalog } = await import('@/lib/catalog/loader');
    await expect(loadCatalog()).rejects.toThrow(/catalog/i);
  });
});

describe('async accessors', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(FIXTURE), {
      status: 200, headers: { 'content-type': 'application/json' },
    })));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

  it('listProducts resolves the product list', async () => {
    const { listProducts } = await import('@/lib/catalog');
    expect((await listProducts()).map((p) => p.slug)).toEqual(['a', 'b']);
  });

  it('getProduct finds by slug and returns undefined for a miss', async () => {
    const { getProduct } = await import('@/lib/catalog');
    expect((await getProduct('a'))?.title).toBe('A');
    expect(await getProduct('nope')).toBeUndefined();
  });

  it('listFeatured returns only featured products', async () => {
    const { listFeatured } = await import('@/lib/catalog');
    expect((await listFeatured()).map((p) => p.slug)).toEqual(['a']);
  });

  it('getPricingLadder computes from real catalog data', async () => {
    const { getPricingLadder } = await import('@/lib/catalog');
    expect(await getPricingLadder()).toEqual({ single: 499, pair: 1499, allSix: 2999 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web test -- catalog-loader`
Expected: FAIL — `Cannot find module '@/lib/catalog/loader'`.

- [ ] **Step 3: Write the loader**

Create `web/lib/catalog/loader.ts`:

```ts
/**
 * The catalog's single read path.
 *
 * The storefront used to import 84 TypeScript product files directly. It now
 * reads them from the API, which reads catalog_products — so an admin edit
 * shows up here without a rebuild, and the price this renders is the same row
 * the charge is computed from.
 *
 * One fetch serves a whole render pass, tagged `catalog` so a write on the
 * API side can revalidate it (see web/app/api/revalidate/route.ts). The
 * in-memory search wants the entire list anyway, so loading it whole costs
 * nothing extra.
 */
import type { Bundle, Product } from './types';
import { API_BASE } from '../env';

export type CatalogPayload = { products: Product[]; bundles: Bundle[] };

export async function loadCatalog(): Promise<CatalogPayload> {
  const res = await fetch(`${API_BASE}/api/catalog/storefront`, {
    next: { tags: ['catalog'], revalidate: 3600 },
  });

  if (!res.ok) {
    // Fail loudly. Returning an empty catalog here would build a storefront
    // with no products in it and no error anywhere.
    throw new Error(`catalog fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as CatalogPayload;
  return { products: data.products ?? [], bundles: data.bundles ?? [] };
}
```

- [ ] **Step 4: Extract `SUPPORT_EMAIL`**

Create `web/lib/support.ts`:

```ts
/**
 * The store's support address.
 *
 * It lives here rather than in lib/catalog because app/order/[id]/page.tsx is
 * a client component: importing it from the catalog would pull the async,
 * API-backed catalog loader into a client bundle.
 */
export { SUPPORT_EMAIL } from './catalog/config';
```

In `web/app/order/[id]/page.tsx`, change:

```ts
import { SUPPORT_EMAIL } from '@/lib/catalog';
```

to:

```ts
import { SUPPORT_EMAIL } from '@/lib/support';
```

- [ ] **Step 5: Make the accessors async**

In `web/lib/catalog/index.ts`, delete the eleven product/bundle `import` statements and the `products`/`productsBySlug`/`bundlesBySlug`/`bundleList` module constants. Keep `export * from './types'` and `export { SUPPORT_EMAIL } from './config'`. Add at the top:

```ts
import { loadCatalog } from './loader';
```

Replace `PRICING_LADDER` with:

```ts
/**
 * The pricing ladder, still computed from real catalog data rather than
 * restated as hardcoded numbers — it just reads that data from the database
 * now. Async because the catalog is.
 */
export async function getPricingLadder(): Promise<{ single: number; pair: number; allSix: number }> {
  const { products, bundles } = await loadCatalog();
  return {
    single: Math.min(...products.map((p) => p.price)),
    pair: bundles.find((b) => b.slug === 'the-complete-man')?.price ?? 1499,
    allSix: bundles.find((b) => b.slug === 'everything-bundle')?.price ?? 2999,
  };
}
```

Then convert each accessor, preserving its exported name and semantics. The full set:

```ts
export async function listProducts(): Promise<Product[]> {
  return (await loadCatalog()).products;
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await loadCatalog()).products.find((p) => p.slug === slug);
}

export async function listBundles(): Promise<Bundle[]> {
  return (await loadCatalog()).bundles;
}

export async function getBundle(slug: string): Promise<Bundle | undefined> {
  return (await loadCatalog()).bundles.find((b) => b.slug === slug);
}

export async function listFeatured(): Promise<Product[]> {
  return (await loadCatalog()).products.filter((p) => p.featured === true);
}

export async function listCategories(): Promise<Category[]> {
  return groupProductsByCategory((await loadCatalog()).products);
}

export async function listProductsByCategory(slug: string): Promise<Product[]> {
  return (await loadCatalog()).products.filter((p) => p.category?.slug === slug);
}
```

`groupProductsByCategory(list)` takes its list as an argument and stays synchronous — do not change it.

For `getPairFor`, `getSetFor` and `findPairBundle`, keep the existing body logic exactly and only change the data source and signature: each becomes `async`, loads the catalog once at the top, and looks up against that in place of the deleted module maps.

- [ ] **Step 6: Await at every call site**

Add `await` to every accessor call across the 27 consuming files, and `async` to any component that now needs it. The full list of consumers is `grep -rl "@/lib/catalog" web/app web/components`. Every one is a server component, so `await` is legal in place.

Two specific cases:
- `generateStaticParams` in `app/p/[slug]/page.tsx`, `app/bundle/[slug]/page.tsx`, `app/category/[slug]/page.tsx` and `app/blog/[slug]/page.tsx` becomes `async` and awaits the accessor.
- `app/layout.tsx` and `components/landing/Footer.tsx` use `listProducts().length` inside metadata and JSX; both become `await`ed. `metadata` in `layout.tsx` must change from an exported const to `export async function generateMetadata()`.
- `app/terms/page.tsx` and `components/landing/PricingLadder.tsx` import `PRICING_LADDER`; both switch to `await getPricingLadder()`.

- [ ] **Step 7: Run the loader tests and typecheck**

Run: `npm --prefix web test -- catalog-loader`
Expected: PASS (6 tests).

Run: `npx --prefix web tsc --noEmit`
Expected: no errors. A "used before assigned" or "Promise<Product> not assignable" error means a call site still needs `await`.

- [ ] **Step 8: Commit**

```bash
git add web/lib/catalog/loader.ts web/lib/support.ts web/lib/catalog/index.ts web/tests/catalog-loader.test.ts web/app web/components
git commit -m "Read the catalog from the database, not from the repo"
```

---

### Task 7: Revalidate on write

**Files:**
- Create: `web/app/api/revalidate/route.ts`
- Create: `web/tests/revalidate-route.test.ts`
- Modify: `api/routes/admin.js` (call it after a catalog write)
- Modify: `.env.example` (document `REVALIDATE_SECRET`)

**Interfaces:**
- Consumes: `revalidateTag` from `next/cache`.
- Produces: `POST /api/revalidate` on the Next app, requiring header `x-revalidate-secret` to equal `process.env.REVALIDATE_SECRET`; returns 204 on success, 401 on a bad or missing secret, 503 when the secret is unset.

- [ ] **Step 1: Write the failing test**

Create `web/tests/revalidate-route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const revalidateTag = vi.fn();
vi.mock('next/cache', () => ({ revalidateTag: (...a: unknown[]) => revalidateTag(...a) }));

function post(secret?: string) {
  return new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: secret === undefined ? {} : { 'x-revalidate-secret': secret },
  });
}

describe('POST /api/revalidate', () => {
  beforeEach(() => { revalidateTag.mockClear(); vi.resetModules(); });
  afterEach(() => { delete process.env.REVALIDATE_SECRET; });

  it('revalidates the catalog tag when the secret matches', async () => {
    process.env.REVALIDATE_SECRET = 's3cret';
    const { POST } = await import('@/app/api/revalidate/route');
    const res = await POST(post('s3cret'));
    expect(res.status).toBe(204);
    expect(revalidateTag).toHaveBeenCalledWith('catalog');
  });

  it('rejects a wrong secret', async () => {
    process.env.REVALIDATE_SECRET = 's3cret';
    const { POST } = await import('@/app/api/revalidate/route');
    expect((await POST(post('wrong'))).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('rejects a missing secret header', async () => {
    process.env.REVALIDATE_SECRET = 's3cret';
    const { POST } = await import('@/app/api/revalidate/route');
    expect((await POST(post())).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('refuses every request when no secret is configured', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    expect((await POST(post('anything'))).status).toBe(503);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web test -- revalidate-route`
Expected: FAIL — `Cannot find module '@/app/api/revalidate/route'`.

- [ ] **Step 3: Write the route**

Create `web/app/api/revalidate/route.ts`:

```ts
/**
 * Drops the cached catalog so an admin edit shows up without a rebuild.
 *
 * api/routes/admin.js calls this after a successful catalog write. It is the
 * only reason the storefront can be both statically rendered and current.
 */
import { revalidateTag } from 'next/cache';

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.REVALIDATE_SECRET;

  // Unset means refuse, never "allow anyone". An open revalidation endpoint
  // is a free cache-flush on demand for anyone who finds the URL.
  if (!expected) {
    return new Response('revalidation is not configured', { status: 503 });
  }

  if (request.headers.get('x-revalidate-secret') !== expected) {
    return new Response('unauthorized', { status: 401 });
  }

  revalidateTag('catalog');
  return new Response(null, { status: 204 });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm --prefix web test -- revalidate-route`
Expected: PASS (4 tests).

- [ ] **Step 5: Call it from the admin write path**

In `api/routes/admin.js`, add near the top:

```js
// Tell the storefront its cached catalog is stale. Best-effort: a failed
// revalidation must not fail the admin's save, which has already committed.
async function revalidateStorefront() {
  const base = (process.env.SITE_URL || '').replace(/\/$/, '');
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) return;
  try {
    await fetch(`${base}/api/revalidate`, {
      method: 'POST',
      headers: { 'x-revalidate-secret': secret },
    });
  } catch (e) {
    console.warn('storefront revalidation failed', e.message);
  }
}
```

Then `await revalidateStorefront();` immediately before each `res.json(...)` in `POST /courses`, `PUT /courses/:id` and `DELETE /courses/:id`.

- [ ] **Step 6: Document the new variable**

In `.env.example`, alongside `SITE_URL`, add:

```
# Shared secret the API uses to tell the storefront its cached catalog is
# stale. Must match REVALIDATE_SECRET in the Next app's environment. If unset,
# the storefront refuses all revalidation requests and catalog edits appear
# only after the cache's own 1-hour expiry.
REVALIDATE_SECRET=
```

- [ ] **Step 7: Commit**

```bash
git add web/app/api/revalidate/route.ts web/tests/revalidate-route.test.ts api/routes/admin.js .env.example
git commit -m "Refresh the storefront when an admin saves"
```

---

### Task 8: Bring the existing suite back to green

**Files:**
- Create: `web/tests/helpers/catalog-fixture.ts`
- Modify: the 13 test files under `web/tests/` that import `@/lib/catalog`
- Create: `web/tests/price-parity.test.ts`

**Interfaces:**
- Consumes: `loadCatalog` from Task 6; the `--full` export from Task 2.
- Produces: `web/tests/helpers/catalog-fixture.ts` exporting `stubCatalogFromFiles()`, which mocks the loader with the real TypeScript catalog so existing assertions keep their meaning without a database.

- [ ] **Step 1: Write the fixture helper**

Create `web/tests/helpers/catalog-fixture.ts`:

```ts
/**
 * Serves the real TypeScript catalog to tests through the loader seam.
 *
 * The TS product files stopped being the runtime source in phase 1, but they
 * are still the most faithful catalog we have, so tests keep asserting
 * against them — 84 real products with real copy, rather than a handful of
 * invented fixtures that would not catch a shape regression.
 */
import { vi } from 'vitest';
import type { CatalogPayload } from '@/lib/catalog/loader';

export async function realCatalog(): Promise<CatalogPayload> {
  const products = await import('@/lib/catalog/products/glow-up-os');
  void products;
  const mod = await import('@/lib/catalog/fixture-source');
  return mod.fixtureCatalog();
}

export function stubCatalogFromFiles(payload: CatalogPayload) {
  vi.mock('@/lib/catalog/loader', () => ({
    loadCatalog: async () => payload,
  }));
}
```

Also create `web/lib/catalog/fixture-source.ts`, which keeps the static imports the accessors gave up:

```ts
/**
 * The TypeScript catalog, still importable as data.
 *
 * lib/catalog/index.ts stopped importing these files when the database became
 * the source of truth. They remain the input to
 * api/scripts/migrate-catalog.js and the fixture for the test suite, so this
 * module keeps one place that assembles them.
 */
import type { Bundle, Product } from './types';
import { glowUpOs } from './products/glow-up-os';
import { auraOs } from './products/aura-os';
import { moneyOs } from './products/money-os';
import { socialOs } from './products/social-os';
import { studyOs } from './products/study-os';
import { careerOs } from './products/career-os';
import { allCharacterGuideProducts } from './products/character-guides';
import { allTalkingToYourParentsProducts } from './products/talking-to-your-parents';
import { allTheTenSeriesProducts } from './products/the-ten-series';
import { bundles } from './bundles';

export function fixtureCatalog(): { products: Product[]; bundles: Bundle[] } {
  return {
    products: [
      glowUpOs, auraOs, moneyOs, socialOs, studyOs, careerOs,
      ...allCharacterGuideProducts,
      ...allTalkingToYourParentsProducts,
      ...allTheTenSeriesProducts,
    ],
    bundles,
  };
}
```

Point `web/scripts/export-catalog.js` at `fixture-source` instead of `index` for its `--full` mode, since `index` no longer holds the data.

- [ ] **Step 2: Convert one test file and confirm the pattern**

Take `web/tests/product-pages.test.tsx`. At the top, add the loader mock and hoist the product list:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fixtureCatalog } from '@/lib/catalog/fixture-source';

vi.mock('@/lib/catalog/loader', () => ({
  loadCatalog: async () => fixtureCatalog(),
}));

import ProductPage, { generateStaticParams, generateMetadata } from '@/app/p/[slug]/page';
import { formatRupees } from '@/lib/format';

const { products } = fixtureCatalog();
```

Then replace `listProducts()` with `products` throughout the file, and `await` `generateStaticParams()`:

```tsx
describe('generateStaticParams', () => {
  it('generates a static param for every catalog product (84: 6 launch + 78 imported)', async () => {
    const params = await generateStaticParams();
    const slugs = params.map((p) => p.slug).sort();
    expect(slugs).toEqual(products.map((p) => p.slug).sort());
    expect(slugs.length).toBe(84);
  });
});
```

Run: `npm --prefix web test -- product-pages`
Expected: PASS. This is the pattern for the remaining files.

- [ ] **Step 3: Apply the same pattern to the other 12 files**

Run `grep -rl "@/lib/catalog" web/tests` for the list. For each: add the `vi.mock` of `@/lib/catalog/loader`, replace module-scope accessor calls with `fixtureCatalog()` destructuring, and `await` any accessor or `generateStaticParams` call inside a test.

`web/tests/catalog.test.ts` is the largest (528 lines) and asserts on catalog invariants directly — it should import `fixtureCatalog()` and assert against that, since it is testing the catalog data rather than the read path.

- [ ] **Step 4: Add the price-parity regression test**

Create `web/tests/price-parity.test.ts`:

```ts
/**
 * The bug this phase exists to fix: the storefront advertised one price while
 * the API charged another, because they read different tables.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fixtureCatalog } from '@/lib/catalog/fixture-source';

describe('advertised price equals migrated price', () => {
  it('every product and bundle exports the price the migration will store', () => {
    const script = path.join(process.cwd(), 'scripts', 'export-catalog.js');
    const out = execFileSync(process.execPath, [script, '--full'], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    });
    const exported = JSON.parse(out) as ReturnType<typeof fixtureCatalog>;
    const { products, bundles } = fixtureCatalog();

    const priceOf = (list: Array<{ slug: string; price: number }>) =>
      new Map(list.map((x) => [x.slug, x.price]));

    const exportedPrices = priceOf([...exported.products, ...exported.bundles]);
    for (const item of [...products, ...bundles]) {
      expect(exportedPrices.get(item.slug)).toBe(item.price);
    }
  });
});
```

- [ ] **Step 5: Run the full suite both sides**

Run: `npm --prefix web test`
Expected: PASS — at least the original 624, plus the new tests from Tasks 2, 6, 7 and this task.

Run: `npm --prefix api test`
Expected: PASS.

Run: `npm --prefix web run build`
Expected: build succeeds with 84 product pages generated. It needs the API running, per the spec's error-handling decision.

Run: `npm --prefix web run lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add web/tests web/lib/catalog/fixture-source.ts web/scripts/export-catalog.js
git commit -m "Point the suite at the loader seam, and pin advertised price to charged price"
```

---

## Self-Review

**Spec coverage.** Schema and order linkage → Task 1. Full-fidelity export → Task 2. Migration of 84 products and 6 bundles, and its idempotency test → Task 3. `GET /api/catalog/storefront`, row shaping, malformed-JSONB handling → Task 4. The price fix and `resolveProduct` branch → Task 5. Async accessors, the loader, `SUPPORT_EMAIL` extraction, build-time failure behaviour → Task 6. Revalidation and its secret handling → Task 7. Test adaptation and the price-parity regression test → Task 8. Every spec section maps to a task.

**Known gaps, deliberately deferred.** The spec's "API unreachable at revalidation serves the last good catalog" is Next's own cache behaviour once the tag is set, so no task implements it; it is asserted by nothing and should be verified by hand. The `catalog-shape-agnostic.test.tsx` file builds synthetic products to prove the catalog is shape-agnostic — Task 8 step 3 covers it, but it may need more than the mechanical pattern, since it constructs its own fixtures.

**Type consistency.** `loadCatalog` returns `CatalogPayload` in Tasks 6, 7 and 8. `shapeRow` is used only in Task 4. `splitRow(item, kind)` returns `{ columns, content }` in Task 3 only. `resolveProduct`'s catalog branch returns `catalogProductId`, consumed by the order INSERT in the same task. `getPricingLadder` replaces `PRICING_LADDER` and is referenced in Task 6 step 6 and its test.

**Ordering constraint.** Tasks 1 → 3 → 4 → 6 are strictly sequential (table before migration before endpoint before reader). Task 2 must precede Task 3. Task 5 needs Task 1 only. Task 7 is independent of Tasks 2–5. Task 8 must come last.
