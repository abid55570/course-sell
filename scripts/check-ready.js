#!/usr/bin/env node
/**
 * Says whether this store is safe to take real money yet.
 *
 * The audit that prompted this found placeholder contact details sitting on
 * live legal pages, a checkout that could not verify a payment, and delivery
 * emails with no file to link. None of those failures announce themselves —
 * the site renders fine and the tests pass — so this collects them into one
 * command with a non-zero exit, suitable for a pre-deploy step.
 *
 * Blockers are things that would mislead a buyer or take money without
 * delivering. Warnings are things an operator should decide on but that do not
 * break a purchase.
 *
 * Usage: npm run check:ready
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname.endsWith('scripts') ? path.join(__dirname, '..') : __dirname;

const blockers = [];
const warnings = [];
const passes = [];

function readEnv(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return null;
  const env = {};
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

/** Walk a directory collecting files with the given extensions. */
function walk(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 1. Placeholder sentinels rendered on real pages.
// ---------------------------------------------------------------------------
const sourceFiles = [
  ...walk(path.join(ROOT, 'web', 'app'), ['.ts', '.tsx']),
  ...walk(path.join(ROOT, 'web', 'components'), ['.ts', '.tsx']),
  ...walk(path.join(ROOT, 'web', 'lib'), ['.ts', '.tsx']),
];

const sentinelHits = new Map();
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/REPLACE_[A-Z_]+/g)) {
    if (!sentinelHits.has(m[0])) sentinelHits.set(m[0], new Set());
    sentinelHits.get(m[0]).add(path.relative(ROOT, file));
  }
}

if (sentinelHits.size === 0) {
  passes.push('No REPLACE_ placeholders in web source');
} else {
  for (const [sentinel, files] of sentinelHits) {
    blockers.push(
      `${sentinel} still ships — buyers see it. Defined in ${[...files].sort()[0]}` +
        (files.size > 1 ? ` (+${files.size - 1} more file${files.size > 2 ? 's' : ''})` : '')
    );
  }
}

// ---------------------------------------------------------------------------
// 2. Environment values that are still the example defaults.
// ---------------------------------------------------------------------------
const env = readEnv('.env');
const webEnv = readEnv(path.join('web', '.env.local'));

if (!env) {
  blockers.push('.env is missing entirely');
} else {
  const EXAMPLE_VALUES = {
    SUPPORT_EMAIL: ['your-email@gmail.com', ''],
    SITE_NAME: ['My Course Hub', ''],
    SMTP_FROM_NAME: ['My Course Hub', 'Course Hub'],
  };
  for (const [key, bad] of Object.entries(EXAMPLE_VALUES)) {
    if (bad.includes(env[key] ?? '')) {
      blockers.push(`${key} is still the example value (${env[key] || 'empty'})`);
    } else {
      passes.push(`${key} is set to a real value`);
    }
  }

  // ADMIN_EMAIL is the admin panel's login identifier, not a delivery address —
  // nothing is ever sent to it, so it needs no mailbox and is not a blocker.
  // It is still worth changing: `admin@example.com` is the first username
  // anyone would try, which leaves ADMIN_PASSWORD doing all the work.
  if (['admin@example.com', ''].includes(env.ADMIN_EMAIL ?? '')) {
    warnings.push(
      'ADMIN_EMAIL is the default admin login (admin@example.com) — no mailbox needed, ' +
        'but a guessable username leaves the password as the only barrier. ' +
        'Change it and re-run `npm --prefix api run init-admin`'
    );
  } else {
    passes.push('ADMIN_EMAIL is not the default login');
  }

  // Outbound email. Without it utils/email.js logs "[email] would send" and
  // delivers nothing — so a buyer pays, the order completes, and no download
  // link ever reaches them. Silent, and the worst failure in the system.
  const EMAIL_PLACEHOLDERS = ['your-16-char-app-password', 'your-email@gmail.com', ''];
  const smtpUnset = ['SMTP_USER', 'SMTP_PASS'].filter((k) =>
    EMAIL_PLACEHOLDERS.includes(env[k] ?? '')
  );
  if (smtpUnset.length) {
    blockers.push(
      `Email is not configured (${smtpUnset.join(', ')} unset or still the example value) — ` +
        'orders complete but no delivery email is ever sent'
    );
  } else {
    passes.push('Outbound email is configured');
    if (env.SMTP_USER && env.SUPPORT_EMAIL && env.SMTP_USER !== env.SUPPORT_EMAIL) {
      warnings.push(
        `SMTP_USER (${env.SMTP_USER}) and SUPPORT_EMAIL (${env.SUPPORT_EMAIL}) differ — ` +
          'delivery emails will come from one address and ask buyers to reply to another'
      );
    }
  }

  // Signing secrets. A forgeable admin token is a worse failure than any
  // wrong site name, and this checked neither.
  const PLACEHOLDER_SECRETS = [
    'replace-with-a-long-random-string-min-32-chars',
    'changeme',
    'dev-secret',
    '',
  ];
  for (const key of ['JWT_SECRET', 'SESSION_SECRET']) {
    const value = env[key] ?? '';
    if (PLACEHOLDER_SECRETS.includes(value)) {
      blockers.push(`${key} is unset or still the example value — admin tokens would be forgeable`);
    } else if (value.length < 32) {
      blockers.push(`${key} is only ${value.length} characters; use at least 32`);
    } else {
      passes.push(`${key} is a real secret`);
    }
  }

  if (['ChangeMe123!', 'changeme', ''].includes(env.ADMIN_PASSWORD ?? '')) {
    blockers.push('ADMIN_PASSWORD is the default — anyone who finds /admin can confirm orders and change prices');
  } else {
    passes.push('ADMIN_PASSWORD is not the default');
  }

  // NODE_ENV is load-bearing: it is what disables the Razorpay dev bypass and
  // what makes the admin cookie `secure`. Nothing verified it.
  if (env.NODE_ENV !== 'production') {
    warnings.push(
      `NODE_ENV is "${env.NODE_ENV || 'unset'}" in this .env. On the server it must be ` +
        'production — it is what disables the payment bypass and sets the secure cookie flag'
    );
  } else {
    passes.push('NODE_ENV is production');
  }

  // Payments.
  const razorpayKeys = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'];
  const missingRazorpay = razorpayKeys.filter((k) => !env[k]);
  if (missingRazorpay.length) {
    blockers.push(
      `Razorpay is not configured (${missingRazorpay.join(', ')} empty) — ` +
        'checkout cannot verify a real payment'
    );
  } else {
    passes.push('Razorpay keys are configured');
  }

  if (env.RAZORPAY_DEV_BYPASS === 'true') {
    warnings.push(
      'RAZORPAY_DEV_BYPASS=true — orders complete with no payment signature. ' +
        'Refused automatically when NODE_ENV=production, but unset it before deploying'
    );
  }

  // URLs that must not point at a developer's machine.
  for (const [label, value] of [
    ['SITE_URL (.env)', env.SITE_URL],
    ['NEXT_PUBLIC_SITE_URL (web/.env.local)', webEnv?.NEXT_PUBLIC_SITE_URL],
  ]) {
    if (!value) blockers.push(`${label} is not set`);
    else if (/localhost|127\.0\.0\.1/.test(value)) {
      blockers.push(`${label} is ${value} — emailed download links would point at localhost`);
    } else passes.push(`${label} points at a real host`);
  }

  // The API origin. NEXT_PUBLIC_API_BASE is inlined into the browser bundle,
  // so a production build made from a localhost value ships a checkout that
  // calls the buyer's own machine. This was checked for SITE_URL but not here.
  for (const [label, value] of [
    ['API_BASE (web/.env.local)', webEnv?.API_BASE],
    ['NEXT_PUBLIC_API_BASE (web/.env.local)', webEnv?.NEXT_PUBLIC_API_BASE],
  ]) {
    if (!value) {
      warnings.push(`${label} is not set; it falls back to localhost:4000`);
    } else if (/localhost|127\.0\.0\.1/.test(value)) {
      blockers.push(
        `${label} is ${value} — a build from this ships a checkout that calls the buyer's own machine`
      );
    } else {
      passes.push(`${label} points at a real host`);
    }
  }

  // STOREFRONT_URL must reach the Next app directly. Left blank in production
  // it falls back to SITE_URL, which goes back through the proxy that routes
  // /api/* to Express — where the revalidation route does not exist.
  if (!env.STOREFRONT_URL) {
    warnings.push(
      'STOREFRONT_URL is unset, so revalidation posts to SITE_URL. If a proxy routes ' +
        '/api/* to the API, that 404s and catalog edits never reach the site. Set it to ' +
        "the Next app's internal address (e.g. http://127.0.0.1:3000)"
    );
  } else {
    passes.push('STOREFRONT_URL is set');
  }

  // Revalidation.
  if (!env.REVALIDATE_SECRET) {
    warnings.push('REVALIDATE_SECRET is unset — catalog edits will not appear until the cache expires');
  } else if (webEnv && webEnv.REVALIDATE_SECRET !== env.REVALIDATE_SECRET) {
    blockers.push('REVALIDATE_SECRET differs between .env and web/.env.local — revalidation will 401');
  } else {
    passes.push('REVALIDATE_SECRET is set and matches on both sides');
  }
}

// ---------------------------------------------------------------------------
// 3. Anything actually deliverable.
// ---------------------------------------------------------------------------
async function checkDeliverables() {
  if (!env?.DATABASE_URL) {
    warnings.push('DATABASE_URL not set — skipped the "is anything deliverable" check');
    return;
  }
  let Pool;
  try {
    ({ Pool } = require(path.join(ROOT, 'api', 'node_modules', 'pg')));
  } catch {
    warnings.push('Could not load pg — skipped the "is anything deliverable" check');
    return;
  }
  const pool = new Pool({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 4000 });
  try {
    const cat = await pool.query('SELECT count(*)::int n FROM catalog_products');
    passes.push(`catalog_products holds ${cat.rows[0].n} rows`);

    // catalog_products has no delivery columns at all — not "none uploaded yet",
    // but no place to put one. Every paid catalog order therefore gets the
    // "your download is not ready yet" email and must be fulfilled by hand.
    // Checking `courses` here would be misleading: the legacy tool and course
    // rows do have files, and none of them are what the storefront sells.
    const hasDeliveryColumn = await pool.query(
      `SELECT count(*)::int n FROM information_schema.columns
        WHERE table_name = 'catalog_products'
          AND column_name IN ('pdf_file', 'drive_link')`
    );
    if (hasDeliveryColumn.rows[0].n === 0) {
      blockers.push(
        'catalog_products has no delivery fields, so every paid catalog order gets a ' +
          '"your download is not ready yet" email and must be fulfilled by hand'
      );
    } else {
      const withFiles = await pool.query(
        'SELECT slug, pdf_file, drive_link FROM catalog_products WHERE pdf_file IS NOT NULL OR drive_link IS NOT NULL'
      );
      if (withFiles.rowCount === 0) {
        blockers.push('No catalog product has a file attached yet — paid orders cannot be delivered');
      } else {
        // Trusting the column was not enough. After a redeploy that did not
        // carry the files across, every row still says "deliverable" while the
        // buyer gets "that file has gone missing". Check the disk.
        const root = path.join(ROOT, 'api', 'storage', 'deliverables');
        const missingOnDisk = withFiles.rows.filter((r) => {
          if (!r.pdf_file) return false;
          return !fs.existsSync(path.join(root, path.basename(r.pdf_file)));
        });
        if (missingOnDisk.length) {
          blockers.push(
            `${missingOnDisk.length} product(s) point at a file that is not on this machine ` +
              `(e.g. ${missingOnDisk[0].slug}). Re-run api/scripts/attach-product-files.js --source <product library>`
          );
        } else {
          passes.push(`${withFiles.rowCount} catalog product(s) have a deliverable, present on disk`);
        }
      }
    }
  } catch (e) {
    warnings.push(`Database check failed (${e.message}) — could not verify deliverables`);
  } finally {
    await pool.end().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
function report() {
  const line = '─'.repeat(72);
  console.log(`\n${line}\nDropdesk readiness check\n${line}`);

  if (blockers.length) {
    console.log(`\n✖ ${blockers.length} blocker${blockers.length > 1 ? 's' : ''} — do not take real money yet:\n`);
    blockers.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));
  }
  if (warnings.length) {
    console.log(`\n! ${warnings.length} warning${warnings.length > 1 ? 's' : ''}:\n`);
    warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
  }
  if (passes.length) {
    console.log(`\n✓ ${passes.length} check${passes.length > 1 ? 's' : ''} passed`);
  }

  console.log(`\n${line}`);
  if (blockers.length === 0) {
    console.log('No blockers. Review the warnings before deploying.\n');
    process.exit(0);
  }
  console.log(`${blockers.length} blocker(s) must be resolved before this store can sell.\n`);
  process.exit(1);
}

checkDeliverables().then(report);
