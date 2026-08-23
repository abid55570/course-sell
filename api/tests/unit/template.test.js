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
  assert.match(html, /Download PDF/);
  assert.match(html, /ORD-TEST123/);
});

test('buildResourcesBlock: omits PDF when flag off', () => {
  const html = buildResourcesBlock(mockCourse, mockOrder, { includePdf: false, includeDrive: true });
  assert.match(html, /Google Drive/);
  assert.doesNotMatch(html, /Download PDF/);
});

test('buildResourcesBlock: omits Drive when flag off', () => {
  const html = buildResourcesBlock(mockCourse, mockOrder, { includePdf: true, includeDrive: false });
  assert.doesNotMatch(html, /Google Drive/);
  assert.match(html, /Download PDF/);
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
  assert.match(html, /Download PDF/);
});

test('renderCompletedEmail: respects visibility flags', () => {
  const html = renderCompletedEmail({
    course: mockCourse, order: mockOrder, includePdf: false, includeDrive: false,
  });
  assert.doesNotMatch(html, /Google Drive/);
  assert.doesNotMatch(html, /Download PDF/);
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
