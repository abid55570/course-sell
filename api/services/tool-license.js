const crypto = require('crypto');
const db = require('../utils/db');
const { getTool } = require('./tool-products');

// Generate a product-scoped license key, e.g. BIO-a1B2c3-D4e5F6-g7H8i9.
function generateKey(prefix) {
  const raw = crypto.randomBytes(18).toString('base64url');
  const p = (prefix || 'TL').toUpperCase();
  return `${p}-${raw.slice(0, 6)}-${raw.slice(6, 12)}-${raw.slice(12, 18)}`;
}

async function create(product, buyerEmail, orderId) {
  const tool = getTool(product);
  const key = generateKey(tool ? tool.keyPrefix : 'TL');
  await db.run(
    'INSERT INTO tool_licenses (product, license_key, buyer_email, order_id) VALUES ($1, $2, $3, $4)',
    [product, key, String(buyerEmail || '').trim().toLowerCase(), orderId]
  );
  return key;
}

// Validate a key. When `product` is given, the key must belong to that product,
// so a biodata key can never unlock the certificate tool.
async function validate(licenseKey, product) {
  if (!licenseKey || typeof licenseKey !== 'string') return null;
  const row = await db.get(
    'SELECT product, license_key, buyer_email, is_active, created_at FROM tool_licenses WHERE license_key = $1',
    [licenseKey.trim()]
  );
  if (!row || !row.is_active) return null;
  if (product && row.product !== product) return null;
  return { product: row.product, email: row.buyer_email, key: row.license_key, created_at: row.created_at };
}

async function findByEmail(email, product) {
  if (!email) return [];
  const params = [String(email).trim().toLowerCase()];
  let sql = 'SELECT product, license_key, is_active, created_at FROM tool_licenses WHERE buyer_email = $1';
  if (product) { params.push(product); sql += ` AND product = $${params.length}`; }
  sql += ' ORDER BY created_at DESC';
  return db.all(sql, params);
}

async function findByOrder(orderId) {
  return db.get('SELECT product, license_key FROM tool_licenses WHERE order_id = $1', [orderId]);
}

module.exports = { create, validate, findByEmail, findByOrder, generateKey };
