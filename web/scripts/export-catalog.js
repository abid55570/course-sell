#!/usr/bin/env node
/**
 * Prints the file-based catalog (web/lib/catalog) as JSON on stdout.
 *
 * The catalog is TypeScript and lives entirely inside the Next.js app, but
 * the API's seed script (api/scripts/seed-catalog.js) needs the same product
 * and bundle data as plain JS objects so it can insert them into the
 * `courses` table. Rather than hand-copying values into a second file that
 * would silently drift from the real catalog, this script requires the
 * actual .ts source at run time and re-derives everything from it, every
 * time it runs. web/lib/catalog stays the single source of truth; nothing
 * about the product data is duplicated by hand anywhere.
 *
 * How it reads .ts without a build step: it registers a `require.extensions`
 * hook that runs the `typescript` package's `transpileModule` (a web/
 * devDependency already, no new dependency added) over any .ts file Node
 * tries to require, stripping types and lowering ESM import/export to
 * CommonJS. Node's own CommonJS resolver already tries every registered
 * extension for an extensionless `require('./foo')`, so the catalog's own
 * extensionless relative imports (`./products/glow-up-os`, `./types`, ...)
 * resolve to their .ts files without any change to the catalog source.
 *
 * Usage: node web/scripts/export-catalog.js   (run from anywhere; it locates
 * its own directory, so cwd doesn't matter). Called by
 * api/scripts/seed-catalog.js via child_process, never invoked as part of
 * `next build` or `next dev` — this script's own require.extensions hook
 * would be the wrong way to load .ts inside the Next.js runtime itself.
 */

const fs = require('fs');
const path = require('path');

let ts;
try {
  ts = require('typescript');
} catch {
  console.error(
    "Could not load the 'typescript' package from web/node_modules. " +
      "Run 'npm --prefix web install' first, then re-run the catalog seed."
  );
  process.exit(1);
}

require.extensions['.ts'] = function compileTs(mod, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      isolatedModules: true,
    },
  });
  mod._compile(outputText, filename);
};

// Read the product data from fixture-source.ts, not index.ts. index.ts's
// accessors became async when the database took over as the source of truth,
// so they no longer hold the catalog; fixture-source.ts is the module that
// still assembles the TypeScript files this script exists to export.
const { fixtureCatalog } = require(path.join(__dirname, '..', 'lib', 'catalog', 'fixture-source.ts'));

/** Joins a product/bundle's sectioned long description into one plain-text blob for `courses.description`. */
function flattenDescription(sections) {
  return (sections || [])
    .map((s) => [s.heading, ...(s.paragraphs || [])].join('\n\n'))
    .join('\n\n---\n\n');
}

function mapProduct(p) {
  return {
    slug: p.slug,
    title: p.title,
    tagline: p.tagline,
    description: flattenDescription(p.longDescription),
    // Deliberately not seeding a fake "was" price: the catalog's own
    // anchorPrice is advisory copy for the owner ("if you want a launch
    // offer, make it real and time-boxed"), not a real historical price, so
    // original_price === discounted_price here — no manufactured discount.
    price: p.price,
    category: p.category.label,
  };
}

function mapBundle(b) {
  return {
    slug: b.slug,
    title: b.title,
    tagline: b.tagline,
    description: flattenDescription(b.longDescription),
    price: b.price,
    // separatePrice ("if bought separately") is real catalog data, not a
    // fabricated anchor, so it is fine to use as the crossed-out original.
    originalPrice: b.separatePrice || b.price,
  };
}

// Two consumers, two shapes.
//
// Default: the trimmed rows api/scripts/seed-catalog.js writes into the
// `courses` mirror that the legacy payment path still reads. Unchanged.
//
// --full: every field of Product and Bundle, verbatim, for
// api/scripts/migrate-catalog.js to load into catalog_products. Unavailable
// bundles are included here — the storefront renders them as "coming soon"
// rather than hiding them, so the database has to hold them.
const source = fixtureCatalog();

if (process.argv.includes('--full')) {
  process.stdout.write(JSON.stringify({ products: source.products, bundles: source.bundles }, null, 2));
} else {
  const products = source.products.map(mapProduct);
  const bundles = source.bundles
    .filter((b) => b.availableToday === true)
    .map(mapBundle);
  process.stdout.write(JSON.stringify({ products, bundles }, null, 2));
}
