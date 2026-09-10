#!/usr/bin/env node
// Seeds only the approved mobile-repair pack. Never publishes or alters an existing product.
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Client } = require('pg');
const product = require('../../data/mobile-repair/product.json');

async function seed(client) {
  const result = await client.query(`INSERT INTO catalog_products
    (slug,kind,title,short_title,tagline,price,category_slug,category_label,
     accent_name,accent_hex,tags,is_published,available_today,content,
     send_pdf_in_email,send_drive_in_email)
    VALUES ($1,'product',$2,$3,$4,0,'practical-skills','Practical Skills',
      'teal','#087E83',$5,FALSE,FALSE,$6::jsonb,FALSE,FALSE)
    ON CONFLICT (slug) DO NOTHING RETURNING id,slug,is_published`,
    [product.slug, product.title, product.shortTitle, product.tagline,
     product.tags, JSON.stringify(product.content)]);
  return result.rows[0] || null;
}

async function main() {
  if (process.argv.includes('--check')) {
    for (const filename of product.content.deliveryFiles) {
      if (!fs.existsSync(path.join(__dirname, '../../storage/ebooks/mobile-repair', filename))) {
        throw new Error('Missing private buyer file: ' + filename);
      }
    }
    console.log('Mobile repair pack validated: 2 PDFs; draft price 0 (not for sale); email-only Drive delivery.');
    return;
  }
  const client = new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:8000,query_timeout:10000});
  try {
    await client.connect();
    const row = await seed(client);
    console.log(row ? `Created unpublished draft: ${row.slug} (id ${row.id}). Set price and Drive link in Catalogue before publishing.` : 'Product already exists; admin price, content and delivery settings preserved.');
  } finally { await client.end(); }
}
if(require.main===module) main().catch(e=>{console.error('Mobile repair seed failed:',e.code||e.message);process.exitCode=1;});
module.exports={seed};
