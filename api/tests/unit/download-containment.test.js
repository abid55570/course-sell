const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { resolveDeliverablePath, DELIVERABLES_ROOT } = require('../../routes/orders');

/**
 * Paid deliverables used to live in public/uploads/pdfs/, which
 * express.static serves with no authentication — so every product was
 * downloadable at a URL guessable from its own public slug, and the payment
 * gate on GET /api/orders/:id/pdf was decorative. They live outside the web
 * root now, and this route is the only way to reach them.
 *
 * Only the basename of the stored value is used, which makes escaping the root
 * structurally impossible rather than merely checked for.
 */

test('the deliverables root is outside the web root', () => {
  // The whole point. If this ever moves back under public/, every product
  // becomes a free download again.
  assert.ok(!DELIVERABLES_ROOT.includes(`${path.sep}public${path.sep}`));
  assert.ok(DELIVERABLES_ROOT.endsWith(path.join('storage', 'deliverables')));
});

test('resolves a bare filename, as the attach script now stores', () => {
  const abs = resolveDeliverablePath('glow-up-os.zip');
  assert.equal(abs, path.join(DELIVERABLES_ROOT, 'glow-up-os.zip'));
});

test('still resolves legacy /uploads/pdfs/ values written by the old uploader', () => {
  // Existing rows carry that prefix; taking the basename keeps them working
  // without a data migration.
  const abs = resolveDeliverablePath('/uploads/pdfs/glow-up-os.zip');
  assert.equal(abs, path.join(DELIVERABLES_ROOT, 'glow-up-os.zip'));
});

test('every result stays inside the deliverables root', () => {
  // Traversal attempts do not escape — they degrade into a filename lookup
  // inside the root, which then fails the existsSync check in the route.
  for (const stored of [
    '../../.env',
    '/uploads/../../.env',
    '/../server.js',
    '/etc/passwd',
    'C:/Windows/System32/drivers/etc/hosts',
    'uploads\\..\\..\\.env',
    '....//....//.env',
  ]) {
    const abs = resolveDeliverablePath(stored);
    if (abs === null) continue;
    const rel = path.relative(DELIVERABLES_ROOT, abs);
    assert.ok(
      rel && !rel.startsWith('..') && !path.isAbsolute(rel),
      `${stored} escaped the root as ${abs}`
    );
    assert.equal(path.dirname(abs), DELIVERABLES_ROOT, `${stored} left the root directory`);
  }
});

test('refuses values that name no file at all', () => {
  for (const stored of ['', '.', '..', '/', null, undefined, 42, {}]) {
    assert.equal(resolveDeliverablePath(stored), null, `${JSON.stringify(stored)} should be refused`);
  }
});
