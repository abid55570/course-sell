# Admin CMS — Phase 1: the database becomes the catalog

Date: 2026-08-25
Status: approved, ready for implementation planning

## Why

The admin panel already accepts every field you would want to edit — title,
description, thumbnail upload, PDF, prices, category, published flag
(`api/routes/admin.js`, `PUT /courses/:id`). It is not missing features. The
problem is that nothing the admin edits reaches the storefront, because the
storefront never reads the database.

Every product page renders statically from `web/lib/catalog/*.ts`
(`web/app/p/[slug]/page.tsx` calls `getProduct(slug)`; the file contains no
`fetch`). Meanwhile the amount a buyer is actually charged is computed from
`courses.discounted_price` (`api/routes/orders.js`, `resolveProduct`).

So changing a price in the admin panel today leaves the storefront
advertising the old price while the buyer is charged the new one. That is a
live correctness bug, not merely a missing feature, and it is the thing this
phase fixes.

## Scope

This is phase 1 of three. It moves the catalog's source of truth into
Postgres and points the storefront at it. **No admin UI work happens here** —
after this phase an admin can change the catalog through the existing API and
the storefront will reflect it.

- Phase 1 (this document): schema, migration of 84 products and 6 bundles,
  storefront reads the database, price bug fixed.
- Phase 2: the nested-content editor UI (modules, sections, FAQs, gallery).
- Phase 3: drafts, preview, revalidation UX, audit log.

Out of scope for phase 1: any change to how products are edited, any new
admin screen, and the missing-product-files problem (no PDFs ship in the
repo — tracked separately).

## Decisions taken

| Decision | Choice | Why |
|---|---|---|
| Editable surface | Everything, eventually | Owner's call; phase 1 lays the data layer for it |
| Table | New `catalog_products` | Owner's call over extending `courses` |
| Nested content | One `content` JSONB column | Nothing ever filters inside a product's modules or sections |
| Products and bundles | One table, `kind` discriminator | Shared fields dominate; one accessor path, one FK for orders |
| Order linkage | Nullable `catalog_product_id` plus exactly-one CHECK | No shadow rows, no price sync, no rewrite of existing orders |
| Storefront data access | New API endpoint over HTTP | Keeps `web/` free of DB credentials; the fetch is per-revalidation, not per-request |
| TS catalog files | Kept as migration input and test fixtures | Runtime stops reading them; deleting them waits for phase 2 |

## Schema

New migration `api/migrations/011_catalog_products.sql`, following house style
(idempotent, `IF NOT EXISTS`, `idx_*` index names, a `DO` block guard for
constraints).

```sql
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
```

Real columns are exactly what something queries, sorts or charges on. Search
scores against title, short title, tagline, category label and tags
(`web/lib/search.ts`); listings filter on category, featured and published;
`price` must be a column because the charge reads from it.

The `content` JSONB holds what the product page renders as a whole:
`modules`, `longDescription`, `bulletPoints`, `faqs`, `gallery`, `helplines`,
`deliveryFiles`, `disclaimer`, `format`, `audience`, `pageCount`,
`trackerCount`, `fileCount`, `fileSizeLabel`, and for bundles `components`
and `separatePrice`.

### Order linkage

Migration 003 already added `orders_product_ref_chk` asserting
`course_id IS NOT NULL OR video_project_id IS NOT NULL`, so it must be
replaced, not extended. Same migration file, after the table exists:

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS catalog_product_id
  BIGINT REFERENCES catalog_products(id);

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_ref_chk;
ALTER TABLE orders ADD CONSTRAINT orders_product_ref_chk CHECK (
  (course_id IS NOT NULL)::int
+ (video_project_id IS NOT NULL)::int
+ (catalog_product_id IS NOT NULL)::int = 1
);
```

This tightens the rule from "at least one" to "exactly one". The migration
must check that no existing row sets two references before adding the
constraint, and fail loudly with the offending order ids if any does.

## Read path

### New endpoint

`GET /api/catalog/storefront` returns the full published catalog, both kinds,
already shaped as the storefront's `Product` and `Bundle` types — JSONB
`content` merged over the real columns, with category and accent reassembled
into the nested objects the types declare.

The existing `GET /api/catalog` is left alone. It filters on board, class
level and subject against `courses` — leftovers from migration 010's
Rapid-Revision iteration — and bending it to serve this shape would break
whatever still calls it.

### Accessors

`web/lib/catalog/index.ts` keeps its 12 exported accessors and their public
names. Internally they stop reading static imports and start reading one
cached `loadCatalog()`, which fetches the endpoint with a `catalog` cache
tag. The accessors become async.

This works because every catalog consumer is already a server component. The
one exception is `web/app/order/[id]/page.tsx`, a client component importing
only `SUPPORT_EMAIL`; that constant moves to its own module so no client
bundle pulls in the async catalog.

`generateStaticParams` reads the same loader, so all 84 product pages stay
statically generated. The in-memory search keeps working unchanged — it wants
the whole list in memory anyway, which is exactly what the loader provides.

### Freshness

A new `POST /api/revalidate` route on the Next app, guarded by a shared
secret, calls `revalidateTag('catalog')`. `api/routes/admin.js` calls it after
any successful catalog write. Edits appear in about a second with no rebuild
and no per-request database cost.

If the secret is unset the route refuses every request rather than defaulting
to open.

### The price fix

`resolveProduct` in `api/routes/orders.js` gains a branch: a catalog item
resolves through `catalog_products` and takes its `price` from the same row
the storefront rendered. The advertised price and the charged price become
one number, so they cannot drift.

## Migration of existing content

`web/scripts/export-catalog.js` currently trims each product to six fields
for the `courses` mirror. Phase 1 needs the complete shape, so it gains a
full-fidelity export mode emitting every field of `Product` and `Bundle`
verbatim, reusing its existing `require.extensions` TypeScript hook.

A new `api/scripts/migrate-catalog.js` consumes that export and upserts into
`catalog_products` by slug: scalars to columns, everything else to `content`.
Idempotent, so it can be re-run safely.

The old `api/scripts/seed-catalog.js` stays untouched in phase 1 — it feeds
the `courses` mirror the payment path still uses for legacy products.

The TypeScript catalog files remain in the repo after migration. They are the
migration's input and the tests' fixtures. Deleting them belongs to phase 2,
once the editor can produce content without them.

## Testing

The suite is 624 tests across 23 files, 13 of which import `@/lib/catalog`.
They already `await` page components, so async accessors do not break the
rendering pattern. Two mechanical changes are needed:

1. Tests iterating the catalog at module scope
   (`for (const product of listProducts())`) become top-level `await`.
2. `generateStaticParams` assertions gain an `await`.

The loader is the test seam. Tests stub it with a fixture built from the
existing TypeScript catalog via the full-fidelity export, so every current
assertion stays meaningful and no test needs a database.

New tests this phase must add:

- The exactly-one-reference CHECK rejects an order with two references and
  accepts one with each single reference.
- The storefront price and the price `resolveProduct` computes are equal for
  every catalog product — the regression test for the bug that motivated this
  work.
- `GET /api/catalog/storefront` returns a shape satisfying the `Product` and
  `Bundle` types, including a product with no modules and a bundle carrying
  `inCatalog: false` components.
- `POST /api/revalidate` rejects a missing, wrong, or unset secret.
- The migration is idempotent: running it twice leaves one row per slug and
  does not revert an admin's edit to a column it does not own.

## Error handling

- **API unreachable at build.** `generateStaticParams` fails the build loudly
  rather than emitting zero pages and shipping an empty store.
- **API unreachable at revalidation.** The last good cached catalog keeps
  serving; the stale window is a logged warning, not an outage.
- **Product missing or unpublished.** Accessors return `undefined`, which the
  pages already handle via `notFound()`.
- **Malformed `content` JSONB.** The endpoint validates each row against the
  expected shape and omits a row it cannot shape, logging the slug. One bad
  row must not take down the listing.
- **Revalidation secret unset.** The route refuses all requests.

## Risks

- Making 12 accessors async touches 27 consuming files. Contained, but it is
  the largest mechanical diff in the phase.
- Tightening the order constraint could fail on existing data. The migration
  checks first and reports offending rows.
- After this phase the storefront depends on the API being reachable to
  build. That is new coupling, and it is the cost of the chosen table split.
