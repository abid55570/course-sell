const test = require('node:test');
const assert = require('node:assert/strict');
const {
  renderTemplate,
  renderCompletedEmail,
  buildResourcesBlock,
  escapeHtml,
} = require('../../utils/template');

const mockCourse = {
  title: 'Full Stack <Bootcamp>',
  slug: 'full-stack',
  pdf_file: '/uploads/pdfs/123.pdf',
  drive_link: 'https://drive.google.com/folder/abc',
};

const mockOrder = {
  order_id: 'ORD-TEST123',
  buyer_name: 'Jane',
  buyer_email: 'jane@example.com',
  amount: 1499,
};

test('escapeHtml: escapes HTML metacharacters', () => {
  assert.equal(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  assert.equal(escapeHtml("a & b"), 'a &amp; b');
});

test('renderTemplate: replaces placeholders and escapes by default', () => {
  const out = renderTemplate('Hello {{ name }}!', { name: '<b>Jane</b>' });
  assert.equal(out, 'Hello &lt;b&gt;Jane&lt;/b&gt;!');
});

test('renderTemplate: supports raw mode (no escape)', () => {
  const out = renderTemplate('{{html}}', { html: '<p>x</p>' }, { escape: false });
  assert.equal(out, '<p>x</p>');
});

test('renderTemplate: missing keys render as empty string', () => {
  const out = renderTemplate('A={{a}};B={{b}}', { a: '1' });
  assert.equal(out, 'A=1;B=');
});

test('buildResourcesBlock: includes both when flags on and resources exist', () => {
  const html = buildResourcesBlock(mockCourse, mockOrder, { includePdf: true, includeDrive: true });
  assert.match(html, /Google Drive/);
  assert.match(html, /\/api\/orders\/[^/]+\/pdf/);
  assert.match(html, /ORD-TEST123/);
});

test('buildResourcesBlock: omits PDF when flag off', () => {
  const html = buildResourcesBlock(mockCourse, mockOrder, { includePdf: false, includeDrive: true });
  assert.match(html, /Google Drive/);
  assert.doesNotMatch(html, /\/api\/orders\/[^/]+\/pdf/);
});

test('buildResourcesBlock: omits Drive when flag off', () => {
  const html = buildResourcesBlock(mockCourse, mockOrder, { includePdf: true, includeDrive: false });
  assert.doesNotMatch(html, /Google Drive/);
  assert.match(html, /\/api\/orders\/[^/]+\/pdf/);
});

test('buildResourcesBlock: a buyer with nothing to download is told what happens next', () => {
  const html = buildResourcesBlock(
    { ...mockCourse, pdf_file: null, drive_link: null },
    mockOrder,
    { includePdf: true, includeDrive: true }
  );
  // This reaches someone who has already been charged. It used to read "No
  // additional resources are attached", which leaves a paying customer to work
  // out what that means. It must confirm the payment landed and give them a
  // route to the file.
  assert.match(html, /not ready yet/i);
  assert.match(html, /payment went through/i);
  assert.match(html, /reply to this email/i);
});

test('renderCompletedEmail: default template includes course title and order id', () => {
  const html = renderCompletedEmail({
    course: mockCourse, order: mockOrder, includePdf: true, includeDrive: true,
  });
  assert.match(html, /Full Stack/);
  assert.match(html, /ORD-TEST123/);
  assert.match(html, /Jane/);
  assert.match(html, /Google Drive/);
  assert.match(html, /\/api\/orders\/[^/]+\/pdf/);
});

test('renderCompletedEmail: respects visibility flags', () => {
  const html = renderCompletedEmail({
    course: mockCourse, order: mockOrder, includePdf: false, includeDrive: false,
  });
  assert.doesNotMatch(html, /Google Drive/);
  assert.doesNotMatch(html, /\/api\/orders\/[^/]+\/pdf/);
});

test('renderCompletedEmail: uses custom template when provided', () => {
  const tpl = '<div>Hi {{buyer_name}}, {{course_title}} ready. {{resources_block}}</div>';
  const html = renderCompletedEmail({
    course: mockCourse, order: mockOrder,
    includePdf: true, includeDrive: true,
    customTemplate: tpl,
  });
  assert.match(html, /Hi Jane/);
  assert.match(html, /Full Stack &lt;Bootcamp&gt;/);
  assert.match(html, /Google Drive/);
});

test('renderCompletedEmail: blank custom template falls back to default', () => {
  const html = renderCompletedEmail({
    course: mockCourse, order: mockOrder,
    includePdf: true, includeDrive: true,
    customTemplate: '   ',
  });
  // Marker from the default template, so this still proves the fallback ran.
  assert.match(html, /Payment received/);
});

test('renderCompletedEmail: calls it a product, never a course', () => {
  // The store sells 84 digital products and zero courses. The email used to
  // say "your course is ready" and sign off "Happy learning!", which was wrong
  // on every order placed.
  const html = renderCompletedEmail({
    course: mockCourse, order: mockOrder,
    includePdf: true, includeDrive: true,
  });
  assert.doesNotMatch(html, /course/i);
  assert.doesNotMatch(html, /happy learning/i);
});

// ---------------------------------------------------------------------------
// The delivery email is styled to match the storefront. These pin the parts
// that would drift silently — nobody reviews an email they never receive.
// ---------------------------------------------------------------------------

const BRAND = {
  primary: '#C42B22',   // vermilion, web/app/globals.css --primary
  ink: '#0B1020',       // --color-ink
  inkSoft: '#5A6480',   // --color-ink-soft
  canvas2: '#F6F8FC',   // --color-canvas-2
};

function renderSample(opts = {}) {
  return renderCompletedEmail({
    course: {
      title: 'Glow-Up OS',
      slug: 'glow-up-os',
      pdf_file: '/uploads/pdfs/glow-up-os.zip',
      send_pdf_in_email: true,
      ...(opts.course || {}),
    },
    order: { order_id: 'ORD-BRAND1', buyer_name: 'Anas', buyer_email: 'a@b.c', amount: 999 },
    includePdf: opts.includePdf !== false,
    includeDrive: opts.includeDrive === true,
  });
}

test('delivery email uses the storefront brand colours, not defaults', () => {
  const html = renderSample();
  for (const [name, hex] of Object.entries(BRAND)) {
    assert.ok(html.includes(hex), `email is missing the ${name} brand colour ${hex}`);
  }
});

test('delivery email names the site fonts with real fallbacks', () => {
  const html = renderSample();
  // Gmail loads neither webfont, so each stack must degrade to something
  // installed rather than to the client's default serif.
  assert.match(html, /Instrument Sans/);
  assert.match(html, /Big Shoulders/);
  assert.match(html, /Arial|Helvetica/);
  assert.match(html, /monospace/);
});

test('delivery email lays out in tables, since Outlook has no flexbox', () => {
  const html = renderSample();
  assert.match(html, /<table role="presentation"/);
  assert.doesNotMatch(html, /display:\s*flex/);
  assert.doesNotMatch(html, /display:\s*grid/);
});

test('delivery email carries no <style> block or class attributes', () => {
  // Gmail strips both, so anything relying on them renders unstyled.
  const html = renderSample();
  assert.doesNotMatch(html, /<style/i);
  assert.doesNotMatch(html, /\sclass=/i);
});

test('delivery email repeats the download as a plain link, not only a button', () => {
  // A client that drops the vermilion background would otherwise leave white
  // text on white with no way to reach the file.
  const html = renderSample();
  const links = html.match(/\/api\/orders\/ORD-BRAND1\/pdf/g) || [];
  assert.ok(links.length >= 2, `expected the download URL at least twice, saw ${links.length}`);
});

test('delivery email keeps the honest notice when there is no file', () => {
  const html = renderSample({ course: { pdf_file: null, send_pdf_in_email: false }, includePdf: false });
  assert.match(html, /not ready yet/i);
  assert.match(html, new RegExp(BRAND.primary, 'i'));
});

test('delivery email never announces a download it does not have', () => {
  // The prose lead-in that used to sit above the download block could
  // contradict the "not ready yet" notice. The receipt layout has no such
  // sentence, so this pins that no announcing phrase creeps back in.
  const none = renderSample({ course: { pdf_file: null, send_pdf_in_email: false }, includePdf: false });
  assert.match(none, /not ready yet/i);
  assert.doesNotMatch(none, /here is your download/i);
  assert.doesNotMatch(none, /your files are ready/i);
});

test('delivery email reads as a receipt: paid amount, order, buyer and date', () => {
  // The old layout showed none of these. A buyer returning to this email is
  // usually looking for exactly them.
  const html = renderSample();
  assert.match(html, /Paid/);
  assert.match(html, /₹999/);          // formatted rupees, not a bare number
  assert.match(html, /ORD-BRAND1/);
  assert.match(html, /Payment received/);
  assert.match(html, /Order/);
  assert.match(html, /Buyer/);
});

test('delivery email draws the perforated edges the storefront uses', () => {
  const html = renderSample();
  // Punched holes drawn as characters: a CSS mask does not survive email.
  const perforations = html.match(/&bull;&bull;&bull;/g) || [];
  assert.ok(perforations.length >= 2, 'expected a perforated edge top and bottom');
  assert.match(html, /1px dashed rgba\(11, ?16, ?32, ?0\.28\)/);
});
