const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const db = require('../../utils/db');
async function appFor(t) {
  const app = express();
  app.use('/api/orders', require('../../routes/orders'));
  app.use('/api/courses', require('../../routes/courses'));
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  t.after(() => new Promise(r => server.close(r)));
  return 'http://127.0.0.1:' + server.address().port;
}
test('old PDF endpoint refuses direct download even with an order ID', async t => {
  const base = await appFor(t); const res = await fetch(base + '/api/orders/ORD-PAID/pdf');
  assert.equal(res.status, 410); assert.match((await res.json()).error, /email/);
});
for (const type of ['course','catalog']) test(type + ' order status never discloses content links', async t => {
  const old = db.get; t.after(() => { db.get = old; });
  db.get = async sql => sql.includes('FROM orders') ? { order_id: 'ORD-PAID', status: 'completed', product_type: type, course_id: type === 'course' ? 1 : null, catalog_product_id: type === 'catalog' ? 2 : null } : sql.includes('order_email_deliveries') ? { status: 'delivered', delivered_at: '2026-09-10' } : { title: 'Repair', slug: 'repair', drive_link: 'https://drive.google.com/secret', pdf_file: 'secret.pdf', send_drive_in_email: true, send_pdf_in_email: true };
  const base = await appFor(t); const res = await fetch(base + '/api/orders/ORD-PAID'); const body = await res.json();
  assert.equal(body.delivery_status, 'delivered');assert.equal(body.drive_link, null);assert.equal(body.pdf_file, null);assert.ok(!JSON.stringify(body).includes('secret'));
});
test('public course lookup does not select Drive links or local files', async t => {
  const old = db.get; t.after(() => { db.get = old; });
  db.get = async sql => { assert.doesNotMatch(sql, /drive_link|pdf_file/); return {title:'Repair',original_price:499,discounted_price:499}; };
  const base = await appFor(t); assert.equal((await fetch(base + '/api/courses/repair')).status,200);
});
test('delivery email contains only Drive access even with legacy PDF and custom template configured', async t => {
  const nodemailer = require('nodemailer'); const email = require('../../utils/email');
  const oldCreate = nodemailer.createTransport; const oldUser = process.env.SMTP_USER; const oldPass = process.env.SMTP_PASS;
  t.after(() => { nodemailer.createTransport=oldCreate; oldUser===undefined?delete process.env.SMTP_USER:process.env.SMTP_USER=oldUser; oldPass===undefined?delete process.env.SMTP_PASS:process.env.SMTP_PASS=oldPass; email.resetTransporter(); });
  process.env.SMTP_USER='sender@example.com';process.env.SMTP_PASS='test-only';email.resetTransporter();
  let html;
  nodemailer.createTransport=() => ({sendMail:async msg=>{html=msg.html;return {accepted:['buyer@example.com']};}});
  await email.sendOrderCompletedEmail({order_id:'ORD-1',buyer_email:'buyer@example.com',amount:499}, {title:'Repair',drive_link:'https://drive.google.com/drive/folders/test',send_drive_in_email:true,pdf_file:'private.pdf',send_pdf_in_email:true,email_template_html:'<a href="/api/orders/ORD-1/pdf">old download</a>'});
  assert.ok(html.includes('https://drive.google.com/drive/folders/test')); for (const forbidden of ['/api/orders/', 'private.pdf', 'old download']) assert.ok(!html.includes(forbidden));
});
