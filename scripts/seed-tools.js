#!/usr/bin/env node
// Seeds the six one-time tools: a product row (courses table, kind='product')
// for each, plus its templates from scripts/tool-data/<key>.js. Idempotent —
// safe to re-run; it updates existing rows rather than duplicating.
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const db = require('../utils/db');
const { list } = require('../services/tool-products');

// Longer store descriptions per tool (admin can edit later in the panel).
const DESCRIPTIONS = {
  biodata: 'Create a beautiful, ready-to-share marriage biodata in minutes. Pick a design, fill your details (personal, family, contact, horoscope), and download a print-ready PDF or image. Pay once — no subscription, no watermark.',
  festival: 'Make branded festival offer posters for your shop in seconds. Your logo, shop name and phone number are auto-placed on every festive template — Diwali, Holi, Eid, Raksha Bandhan, New Year and more. Pay ₹299 once for a full year of templates, versus ₹2,000–3,500/year on subscription apps like AdBanao and Brands.live. Export for WhatsApp, Instagram and Facebook.',
  certificate: 'Generate hundreds of personalised certificate PDFs in one go. Upload a CSV of names, pick a template, and download a ZIP of print-ready certificates for your webinar, college fest or training batch. Pay once per business — no per-certificate fees.',
  idcard: 'Turn a CSV into print-ready ID cards for your school or institute. Upload names, roll numbers and photos, pick a template, and export a multi-up PDF ready for the printer. One-time purchase, unlimited cards.',
  qrmenu: 'Create a live, scannable QR menu for your cafe, restaurant or shop. Build your menu, publish it, and print the QR — customers scan to see your latest prices. Update anytime. Pay ₹699 once, use forever — no monthly SaaS fees.',
  rentreceipt: 'Generate 12 months of HRA-ready rent receipts plus a matching rent agreement, in minutes. Fill your details once, download signed-format PDF receipts for your tax claim. Pay once — cheaper than a single CA visit.',
};

async function upsertProduct(tool) {
  const desc = DESCRIPTIONS[tool.key] || tool.tagline;
  const existing = await db.get('SELECT id FROM courses WHERE slug = $1', [tool.key]);
  if (existing) {
    await db.run(
      `UPDATE courses SET title=$1, short_description=$2, description=$3,
         original_price=$4, discounted_price=$5, kind='product', is_published=TRUE, updated_at=NOW()
       WHERE slug=$6`,
      [tool.name, tool.tagline, desc, tool.mrp, tool.price, tool.key]
    );
    console.log(`  product updated: ${tool.key} (₹${tool.price})`);
  } else {
    await db.run(
      `INSERT INTO courses (slug, title, short_description, description, original_price, discounted_price, kind, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,'product',TRUE)`,
      [tool.key, tool.name, tool.tagline, desc, tool.mrp, tool.price]
    );
    console.log(`  product created: ${tool.key} (₹${tool.price})`);
  }
}

async function seedTemplates(tool) {
  const file = path.join(__dirname, 'tool-data', `${tool.key}.js`);
  if (!fs.existsSync(file)) { console.log(`  (no template data for ${tool.key}, skipping)`); return; }
  let mod;
  try { mod = require(file); } catch (e) { console.warn(`  could not load ${file}: ${e.message}`); return; }
  const templates = Array.isArray(mod) ? mod : (mod.templates || []);
  let n = 0;
  for (const t of templates) {
    const dims = t.dimensions ? JSON.stringify(t.dimensions) : null;
    const exists = await db.get('SELECT id FROM tool_templates WHERE product=$1 AND slug=$2', [tool.key, t.slug]);
    if (exists) {
      await db.run(
        `UPDATE tool_templates SET name=$1, category=$2, description=$3, data=$4,
           dimensions=COALESCE($5::jsonb, dimensions), is_free=$6, sort_order=$7, updated_at=NOW()
         WHERE product=$8 AND slug=$9`,
        [t.name, t.category || 'general', t.description || null, JSON.stringify(t.data), dims, !!t.is_free, t.sort_order || 0, tool.key, t.slug]
      );
    } else {
      await db.run(
        `INSERT INTO tool_templates (product, slug, name, category, description, data, dimensions, is_free, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6, COALESCE($7::jsonb,'{"width":1080,"height":1350}'::jsonb), $8, $9)`,
        [tool.key, t.slug, t.name, t.category || 'general', t.description || null, JSON.stringify(t.data), dims, !!t.is_free, t.sort_order || 0]
      );
    }
    n++;
  }
  console.log(`  ${n} templates seeded for ${tool.key}`);
}

async function seed() {
  console.log('Seeding one-time tools...');
  for (const tool of list()) {
    await upsertProduct(tool);
    await seedTemplates(tool);
  }
  console.log('Done.');
}

seed().then(() => db.close()).catch(async (e) => { console.error(e); await db.close(); process.exit(1); });
