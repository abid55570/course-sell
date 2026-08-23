// Central filesystem locations. Clean renders and buyer photos live OUTSIDE
// public/ so they are never served by express.static — they can only be
// reached through the payment-gated download endpoints.

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const RENDERS_DIR = path.join(ROOT, 'storage', 'renders');
const PHOTOS_DIR = path.join(ROOT, 'storage', 'photos');

function ensureDirs() {
  fs.mkdirSync(RENDERS_DIR, { recursive: true });
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}
ensureDirs();

module.exports = { ROOT, RENDERS_DIR, PHOTOS_DIR, ensureDirs };
