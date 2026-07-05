const crypto = require('crypto');
const db = require('../utils/db');

function generateKey() {
  const raw = crypto.randomBytes(18).toString('base64url');
  return `CRS-${raw.slice(0, 6)}-${raw.slice(6, 12)}-${raw.slice(12, 18)}-${raw.slice(18)}`;
}

async function create(buyerEmail, orderId) {
  const key = generateKey();
  await db.run(
    'INSERT INTO carousel_licenses (license_key, buyer_email, order_id) VALUES ($1, $2, $3)',
    [key, buyerEmail.trim().toLowerCase(), orderId]
  );
  return key;
}

async function validate(licenseKey) {
  if (!licenseKey || typeof licenseKey !== 'string') return null;
  const row = await db.get(
    'SELECT license_key, buyer_email, is_active, created_at FROM carousel_licenses WHERE license_key = $1',
    [licenseKey.trim()]
  );
  if (!row || !row.is_active) return null;
  return { email: row.buyer_email, key: row.license_key, created_at: row.created_at };
}

async function findByEmail(email) {
  if (!email) return [];
  return db.all(
    'SELECT license_key, is_active, created_at FROM carousel_licenses WHERE buyer_email = $1 ORDER BY created_at DESC',
    [email.trim().toLowerCase()]
  );
}

module.exports = { create, validate, findByEmail };
