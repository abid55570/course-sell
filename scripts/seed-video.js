// Seed the video generator with its built-in categories and templates.
// The catalog itself lives in services/video-templates.js so the renderer and
// the seed share one source of truth.
require('dotenv').config();
const db = require('../utils/db');
const { CATEGORIES, TEMPLATES } = require('../services/video-templates');
const { resolveTemplatePricing } = require('../services/pricing');

async function main() {
  // Categories first; keep a slug -> id map for templates.
  const catId = {};
  for (const c of CATEGORIES) {
    const r = await db.run(
      `INSERT INTO video_categories (slug, name, icon, sort_order, is_published)
       VALUES ($1,$2,$3,$4,TRUE)
       ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order
       RETURNING id`,
      [c.slug, c.name, c.icon, c.sort_order]
    );
    catId[c.slug] = r.rows[0].id;
  }
  console.log(`Categories: ${Object.keys(catId).length}`);

  let n = 0;
  for (const t of TEMPLATES) {
    const price = resolveTemplatePricing(t); // from tier + current env
    await db.run(
      `INSERT INTO video_templates
        (slug, name, category_id, composition_id, preset, aspect_ratios, duration_seconds,
         language_options, fields_schema, price_tier, original_price, discounted_price, is_published, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,TRUE,$13)
       ON CONFLICT (slug) DO UPDATE SET
         name=EXCLUDED.name, category_id=EXCLUDED.category_id, composition_id=EXCLUDED.composition_id,
         preset=EXCLUDED.preset, aspect_ratios=EXCLUDED.aspect_ratios, duration_seconds=EXCLUDED.duration_seconds,
         fields_schema=EXCLUDED.fields_schema, price_tier=EXCLUDED.price_tier,
         original_price=EXCLUDED.original_price, discounted_price=EXCLUDED.discounted_price, updated_at=NOW()`,
      [
        t.slug, t.name, catId[t.category] || null, t.composition_id,
        JSON.stringify(t.preset || {}), t.aspect_ratios || ['9:16'], t.duration_seconds || 20,
        t.language_options || ['en'], JSON.stringify(t.fields_schema || []),
        t.price_tier || null, price.original_price, price.discounted_price, t.sort_order || n,
      ]
    );
    n += 1;
  }
  console.log(`Templates seeded/updated: ${n} (tiers: low ₹${require('../services/pricing').tierAmounts().low}, mid ₹${require('../services/pricing').tierAmounts().mid}, high ₹${require('../services/pricing').tierAmounts().high} @ ${require('../services/pricing').discountPercent()}% off)`);
  await db.close();
}

main().catch(async (e) => { console.error(e); await db.close(); process.exit(1); });
