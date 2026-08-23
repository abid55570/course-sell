// Central registry for the six one-time creator tools. Each tool is also a row
// in the `courses` table (kind='product', slug === key) so the admin panel
// manages its price / copy / publish state. This registry holds the fixed
// wiring that code needs: the URL paths, the license-key prefix, the default
// price shown in editors, and the free-tier limits.
//
// `key` is the single identifier used everywhere: courses.slug, the orders
// product_type, the tool_templates.product / tool_licenses.product columns, the
// /api/tools/:product URL segment, and the localStorage license key.

const TOOLS = {
  biodata: {
    key: 'biodata',
    type: 'biodata',
    name: 'Marriage Biodata Maker',
    tagline: 'Beautiful, ready-to-share marriage biodata in 2 minutes.',
    keyPrefix: 'BIO',
    landingPath: '/biodata',
    editorPath: '/biodata/editor',
    price: 59,
    mrp: 199,
    freeNote: 'Preview free · pay once to remove the watermark & unlock all designs',
    emoji: '💑',
  },
  festival: {
    key: 'festival',
    type: 'festival',
    name: 'Festival Offer Poster Maker',
    tagline: 'Branded festival offer posters for your shop — logo & number auto-placed.',
    keyPrefix: 'FST',
    landingPath: '/festival',
    editorPath: '/festival/editor',
    price: 299,
    mrp: 999,
    freeNote: 'Pay ₹299 once for a year of festival templates — vs ₹3,000/yr on AdBanao & Brands.live',
    emoji: '🪔',
  },
  certificate: {
    key: 'certificate',
    type: 'certificate',
    name: 'Bulk Certificate Generator',
    tagline: 'Upload a CSV of names, get hundreds of personalised certificate PDFs.',
    keyPrefix: 'CRT',
    landingPath: '/certificate',
    editorPath: '/certificate/editor',
    price: 149,
    mrp: 599,
    freeNote: 'Preview 3 free · pay once for unlimited, watermark-free PDFs',
    emoji: '📜',
  },
  idcard: {
    key: 'idcard',
    type: 'idcard',
    name: 'ID Card Generator',
    tagline: 'CSV in, print-ready ID cards out — for schools & institutes.',
    keyPrefix: 'IDC',
    landingPath: '/idcard',
    editorPath: '/idcard/editor',
    price: 149,
    mrp: 599,
    freeNote: 'Preview 3 free · pay once for unlimited, print-ready cards',
    emoji: '🪪',
  },
  qrmenu: {
    key: 'qrmenu',
    type: 'qrmenu',
    name: 'QR Menu & Price List Maker',
    tagline: 'A live, scannable QR menu for your cafe or shop. Pay once, use forever.',
    keyPrefix: 'QRM',
    landingPath: '/qrmenu',
    editorPath: '/qrmenu/editor',
    price: 699,
    mrp: 1999,
    freeNote: 'Build & preview free · pay once to publish your live QR menu',
    emoji: '🍽️',
  },
  rentreceipt: {
    key: 'rentreceipt',
    type: 'rentreceipt',
    name: 'Rent Receipt Generator (HRA)',
    tagline: '12 months of HRA-ready rent receipts plus a rent agreement, in minutes.',
    keyPrefix: 'RNT',
    landingPath: '/rentreceipt',
    editorPath: '/rentreceipt/editor',
    price: 99,
    mrp: 299,
    freeNote: 'Preview 1 month free · pay once for all 12 receipts + agreement',
    emoji: '🏠',
  },
};

const KEYS = Object.keys(TOOLS);

function getTool(key) {
  return TOOLS[key] || null;
}

// orders.product_type / courses.slug === key, so this is a direct lookup.
function isToolKey(key) {
  return Object.prototype.hasOwnProperty.call(TOOLS, key);
}

function list() {
  return KEYS.map((k) => TOOLS[k]);
}

module.exports = { TOOLS, KEYS, getTool, isToolKey, list };
