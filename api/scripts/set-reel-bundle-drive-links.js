#!/usr/bin/env node
/**
 * Sets catalog_products.drive_link + send_drive_in_email = true for every
 * reel-bundle product, from the single source of truth:
 * web/lib/catalog/products/reel-bundles.ts's `reelBundleDriveFolderIds` map
 * (slug -> real Drive FOLDER id, not a shortcut id — see that file's own
 * header for why the distinction matters).
 *
 * Reads the .ts file at run time the same way web/scripts/export-catalog.js
 * does (a require.extensions['.ts'] hook using the `typescript` package's
 * transpileModule), so the mapping is never hand-copied into this file and
 * can't drift from reel-bundles.ts.
 *
 * Idempotent: safe to re-run after adding/renaming reel bundles. Only
 * touches drive_link and send_drive_in_email on rows whose slug is in the
 * map — everything else in catalog_products (price, title, is_published,
 * ...) is left untouched.
 *
 * IMPORTANT: this sets send_drive_in_email = true unconditionally for every
 * mapped slug, which means every one of these emails a Drive link the
 * moment its is_published flag is flipped on in the admin panel. It does
 * NOT verify that the target folder is actually shared "Anyone with the
 * link" — a folder that still requires request-access will silently send
 * buyers a link that doesn't work for them. Verify sharing on each real
 * target folder (not the shortcut) before publishing, same as the warning
 * already in reel-bundles.ts's file header.
 *
 * Usage: node api/scripts/set-reel-bundle-drive-links.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const db = require('../utils/db');

// `typescript` is a web/ devDependency, and this script lives in api/, so
// Node's own resolver would never look in web/node_modules for it (unlike
// web/scripts/export-catalog.js, which can just require it). Resolve it
// explicitly against web/ rather than adding a second copy to api/.
const WEB_DIR = path.join(__dirname, '..', '..', 'web');
let ts;
try {
  ts = require(require.resolve('typescript', { paths: [WEB_DIR] }));
} catch {
  console.error(
    "Could not load the 'typescript' package from web/node_modules. " +
      "Run 'npm --prefix web install' first, then re-run this script."
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

const { reelBundleDriveFolderIds, reelBundleComboSlugs } = require(
  path.join(__dirname, '..', '..', 'web', 'lib', 'catalog', 'products', 'reel-bundles.ts')
);

function folderIdToLink(folderId) {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

async function main() {
  const slugs = Object.keys(reelBundleDriveFolderIds);
  console.log(`Found ${slugs.length} slug -> folder mappings in reel-bundles.ts.`);

  let updated = 0;
  let missing = [];

  for (const slug of slugs) {
    const folderId = reelBundleDriveFolderIds[slug];
    const driveLink = folderIdToLink(folderId);
    const result = await db.run(
      `UPDATE catalog_products
         SET drive_link = $2, send_drive_in_email = true, updated_at = NOW()
       WHERE slug = $1`,
      [slug, driveLink]
    );
    if (result.rowCount === 0) {
      missing.push(slug);
    } else {
      updated++;
    }
  }

  console.log(`drive_link set on ${updated} catalog_products row(s).`);
  if (missing.length) {
    console.log(
      `\n${missing.length} slug(s) from reel-bundles.ts have no matching catalog_products row ` +
        `(run api/scripts/migrate-catalog.js first, then re-run this script):`
    );
    for (const s of missing) console.log(`  - ${s}`);
  }

  // Combo packs stitch several reel bundles into one purchase. Until a
  // merged Drive folder is added for a combo, unpublish it — a published
  // combo with no drive_link would take an order and then fail delivery
  // with "Product needs an enabled HTTPS Google Drive link" (see
  // api/services/email-delivery.js). A combo that DOES have a folder id
  // in reelBundleDriveFolderIds is treated like any other product and
  // stays published, so this pass is idempotent and safe to re-run.
  if (Array.isArray(reelBundleComboSlugs) && reelBundleComboSlugs.length > 0) {
    const combosLackingFolder = reelBundleComboSlugs.filter(
      (slug) => !reelBundleDriveFolderIds[slug]
    );
    if (combosLackingFolder.length > 0) {
      const result = await db.run(
        `UPDATE catalog_products
            SET is_published = false, send_drive_in_email = false, updated_at = NOW()
          WHERE slug = ANY($1::text[]) AND drive_link IS NULL`,
        [combosLackingFolder]
      );
      console.log(
        `Combos kept unpublished (no merged Drive folder yet): ${result.rowCount} of ${combosLackingFolder.length}.`
      );
    }
  }
}

main()
  .catch((err) => {
    console.error('ERROR:', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());
