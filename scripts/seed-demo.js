require('dotenv').config();
const db = require('../utils/db');

const courses = [
  {
    slug: 'full-stack-web-development',
    title: 'Full Stack Web Development Mastery',
    short_description: 'Build modern web apps with Node, React, and SQL from scratch.',
    description:
      'A complete journey through HTML, CSS, JavaScript, Node.js, Express, React and SQL. Includes 12 hands-on projects, downloadable PDFs, and a private Drive folder with source code.',
    original_price: 4999,
    discounted_price: 1499,
    category: 'Programming',
    level: 'Beginner to Advanced',
    duration: '40 hours',
    drive_link: 'https://drive.google.com/drive/folders/example',
  },
  {
    slug: 'digital-marketing-blueprint',
    title: 'Digital Marketing Blueprint 2026',
    short_description: 'SEO, Ads, Social Media, and Funnels - the complete playbook.',
    description:
      'Learn to run profitable ad campaigns, rank pages on Google, build email funnels, and grow social audiences. Includes templates and case studies.',
    original_price: 2999,
    discounted_price: 999,
    category: 'Marketing',
    level: 'Intermediate',
    duration: '18 hours',
    drive_link: 'https://drive.google.com/drive/folders/example',
  },
  {
    slug: 'ui-ux-design-foundations',
    title: 'UI/UX Design Foundations',
    short_description: 'Design beautiful, usable interfaces with Figma.',
    description:
      'Master visual hierarchy, typography, color theory, and prototyping. Build a portfolio of 5 polished projects.',
    original_price: 3499,
    discounted_price: 1199,
    category: 'Design',
    level: 'Beginner',
    duration: '22 hours',
    drive_link: 'https://drive.google.com/drive/folders/example',
  },
];

async function main() {
  let inserted = 0;
  for (const c of courses) {
    const r = await db.run(
      `INSERT INTO courses (slug, title, short_description, description, original_price, discounted_price, category, level, duration, drive_link, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, TRUE)
       ON CONFLICT (slug) DO NOTHING`,
      [c.slug, c.title, c.short_description, c.description, c.original_price, c.discounted_price, c.category, c.level, c.duration, c.drive_link]
    );
    if (r.rowCount) inserted++;
  }
  console.log(`Seeded ${inserted} new courses (skipped existing).`);
  await db.close();
}

main().catch(async (e) => { console.error(e); await db.close(); process.exit(1); });
