/**
 * generate-covers.ts  v3
 *
 * Marketing-style dark covers matching the product-page hero design:
 *   · Dark navy background + accent radial glow
 *   · Product-name chip + module pill badge (all module titles joined)
 *   · Large 2–3 line headline (last line in accent colour)
 *   · Short tagline paragraph
 *   · Stats grid  (modules · pages · trackers · files)
 *   · Price block + "INSTANT DOWNLOAD · LIFETIME ACCESS"
 *   · DROPDESK wordmark
 *
 * Usage
 * ─────
 *   npx tsx scripts/generate-covers.ts          # skip existing
 *   npx tsx scripts/generate-covers.ts --force  # overwrite all
 *   npx tsx scripts/generate-covers.ts --only=glow-up-os,money-os
 */

import { createCanvas, registerFont } from 'canvas';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixtureCatalog } from '../lib/catalog/fixture-source';
import type { Product, Bundle } from '../lib/catalog/types';

/* ── paths ───────────────────────────────────────────────────────────────── */

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const PUBLIC_DIR = join(__dirname, '..', 'public');

/* ── fonts ───────────────────────────────────────────────────────────────── */

const OG = join(process.cwd(), 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og');
if (existsSync(join(OG, 'Geist-Regular.ttf'))) registerFont(join(OG, 'Geist-Regular.ttf'), { family: 'Geist' });
if (existsSync(join(OG, 'Geist-Bold.ttf')))    registerFont(join(OG, 'Geist-Bold.ttf'),    { family: 'Geist', weight: 'bold' });

const DISPLAY = 'Impact, "Arial Black", sans-serif';
const BODY    = 'Geist, "Helvetica Neue", Arial, sans-serif';

/* ── canvas size ─────────────────────────────────────────────────────────── */

const W  = 1200;
const H  = 1600;
const ML = 64;   // left margin
const MR = 64;   // right margin
const CW = W - ML - MR; // content width

/* ── helpers ─────────────────────────────────────────────────────────────── */

type Ctx = ReturnType<ReturnType<typeof createCanvas>['getContext']>;

function rgba(hex: string, a: number) {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
}

function roundedRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Draw a single pill badge. Returns badge width. */
function drawPill(ctx: Ctx, text: string, x: number, y: number, accent: string): number {
  const PX = 24, R = 7;
  ctx.font = `600 21px ${BODY}`;
  const tw = ctx.measureText(text).width;
  const pw = tw + PX * 2, ph = 44;
  ctx.save();
  roundedRect(ctx, x, y, pw, ph, R);
  ctx.fillStyle   = rgba(accent, 0.13);
  ctx.fill();
  ctx.strokeStyle = rgba(accent, 0.45);
  ctx.lineWidth   = 1.5;
  ctx.stroke();
  ctx.fillStyle   = rgba(accent, 0.88);
  ctx.textBaseline = 'middle';
  ctx.textAlign    = 'left';
  ctx.fillText(text, x + PX, y + ph / 2);
  ctx.restore();
  return pw;
}

/** Draw a headline. Lines are white; the last line is drawn in accent colour. Returns height used. */
function drawHeadline(ctx: Ctx, lines: string[], accent: string, x: number, y: number): number {
  // Auto-shrink so no line overflows
  let size = 156;
  ctx.font = `900 ${size}px ${DISPLAY}`;
  while (size > 72) {
    ctx.font = `900 ${size}px ${DISPLAY}`;
    if (Math.max(...lines.map(l => ctx.measureText(l).width)) <= CW) break;
    size -= 4;
  }
  const lh = size * 0.90;
  lines.forEach((line, i) => {
    ctx.save();
    ctx.font         = `900 ${size}px ${DISPLAY}`;
    ctx.fillStyle    = i === lines.length - 1 ? accent : '#FFFFFF';
    ctx.textBaseline = 'top';
    ctx.textAlign    = 'left';
    ctx.fillText(line, x, y + i * lh);
    ctx.restore();
  });
  return lines.length * lh;
}

/** Wrap and draw body text. Returns height used. */
function drawBody(ctx: Ctx, text: string, x: number, y: number, maxLines = 3): number {
  const SIZE = 30, LH = SIZE * 1.58;
  ctx.save();
  ctx.font         = `400 ${SIZE}px ${BODY}`;
  ctx.fillStyle    = 'rgba(255,255,255,0.62)';
  ctx.textBaseline = 'top';
  ctx.textAlign    = 'left';
  const words: string[] = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const probe = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(probe).width <= CW) { cur = probe; }
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, x, y + i * LH));
  ctx.restore();
  return Math.min(lines.length, maxLines) * LH;
}

function hRule(ctx: Ctx, y: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(ML, y); ctx.lineTo(W - MR, y); ctx.stroke();
  ctx.restore();
}

type Stat = { value: string; label: string };

function drawStats(ctx: Ctx, stats: Stat[], y: number, accent: string) {
  const colW = CW / Math.max(stats.length, 1);
  stats.forEach((s, i) => {
    const x = ML + i * colW;
    ctx.save();
    ctx.font         = `900 68px ${DISPLAY}`;
    ctx.fillStyle    = accent;
    ctx.textBaseline = 'top';
    ctx.textAlign    = 'left';
    ctx.fillText(s.value, x, y);
    ctx.font         = `600 19px ${BODY}`;
    ctx.fillStyle    = 'rgba(255,255,255,0.42)';
    ctx.fillText(s.label.toUpperCase(), x, y + 76);
    ctx.restore();
  });
}

/* ── custom headlines ────────────────────────────────────────────────────── */

/** 2–3 element array. Last element is rendered in accent colour. */
const HEADLINES: Record<string, string[]> = {
  'glow-up-os':              ['STOP LOOKING', 'AVERAGE'],
  'aura-os':                 ['BECOME THE', "WOMAN THEY", "CAN'T IGNORE"],
  'money-os':                ['THE FIRST', '₹1,000'],
  'social-os':               ['THE ROOM', 'REMEMBERS', 'YOU'],
  'study-os':                ['SIX HOURS.', 'NOTHING', 'FORGOTTEN'],
  'career-os':               ['GET HIRED,', 'NOT JUST', 'SCREENED'],
  'skin-os':                 ['SKIN THAT', 'DOES THE', 'TALKING'],
  'sleep-os':                ['WAKE UP A', 'DIFFERENT', 'PERSON'],
  'money-habits-os':         ['10 HABITS.', 'ONE BANK', 'ACCOUNT'],
  'english-confidence-os':   ['SPEAK LIKE', 'YOU MEAN', 'IT'],
  'thirty-days-of-focus':    ['30 DAYS.', 'ONE GOAL.', 'DONE.'],
  'exam-sprint-os':          ['LAST WEEK.', 'FULL', 'SYLLABUS.'],
  'home-workout-os':         ['NO GYM.', 'NO EXCUSE.', 'NO LIMITS.'],
  'gym-beginner-os':         ['FIRST REP.', 'THEN THE', 'REST.'],
  'wedding-glow-up-os':      ['UNFORGETTABLE', 'ON THE', 'DAY.'],
  'creator-os':              ['BUILD YOUR', 'AUDIENCE', 'TODAY.'],
  'presence-os':             ['WALK IN.', 'OWN THE', 'ROOM.'],
  'the-character-codex':     ['40 GUIDES.', '1 CODEX.', 'YOUR MOVE.'],
  'talking-to-your-parents-full-set': ['12 SCRIPTS.', 'EVERY HARD', 'CONVERSATION.'],
  'the-ten-series-full-set': ['22 GUIDES.', 'ONE COMPLETE', 'COLLECTION.'],
  'the-scam-files':          ['EVERY SCAM', 'AIMED AT', 'YOU.'],
};

function capitalise(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function headlineFor(p: Product): string[] {
  if (HEADLINES[p.slug]) return HEADLINES[p.slug];

  // Character guides: "how-to-be-like-thomas-shelby"
  if (p.slug.startsWith('how-to-be-like-')) {
    const name = p.slug.replace('how-to-be-like-', '').split('-').map(capitalise).join(' ');
    const words = name.split(' ');
    if (words.length <= 2) return ['HOW TO', 'BE LIKE', name.toUpperCase()];
    return ['HOW TO BE', 'LIKE', name.toUpperCase()];
  }

  // Ten-series style slugs: "10-ways-to-*"  "10-things-*"  "10-money-habits-*"
  if (p.slug.match(/^10-/)) {
    const words = (p.shortTitle ?? p.title).toUpperCase().replace('10 WAYS TO ', '10 WAYS TO\n').split('\n');
    if (words.length >= 2) {
      const rest = words[1].split(' ');
      const mid  = Math.ceil(rest.length / 2);
      return [words[0], rest.slice(0, mid).join(' '), rest.slice(mid).join(' ')].filter(Boolean);
    }
    const all = words[0].split(' ');
    const t = Math.ceil(all.length / 3);
    return [all.slice(0, t).join(' '), all.slice(t, t * 2).join(' '), all.slice(t * 2).join(' ')].filter(Boolean);
  }

  // Scam / fraud / trap single-issue guides
  if (p.slug.includes('scam') || p.slug.includes('fraud') || p.slug.includes('trap') || p.slug.includes('arrest')) {
    const words = (p.shortTitle ?? p.title).toUpperCase().split(' ');
    const mid   = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].filter(Boolean);
  }

  // Talking-to-parents family: derive 2-line headline from the title
  const title = (p.shortTitle ?? p.title).toUpperCase();
  const words = title.split(' ');
  const mid   = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].filter(Boolean);
}

function bundleHeadline(b: Bundle): string[] {
  const words = b.title.toUpperCase().split(' ');
  if (words.length <= 3) return ['THE', words.join(' ')];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

/* ── pill badge text ─────────────────────────────────────────────────────── */

function pillFor(p: Product): string {
  if (p.modules?.length) return p.modules.map(m => m.title).join(' · ');
  if (p.category.slug === 'character-guides')        return 'MINDSET · HABITS · LIFESTYLE · SPEECH';
  if (p.category.slug === 'talking-to-your-parents') return 'GUIDE · SCRIPTS · TIPS';
  if (p.category.slug === 'the-ten-series')          return '10 THINGS THAT ACTUALLY WORK';
  if (p.category.slug === 'the-scam-files')          return 'WHAT TO SPOT · HOW TO RESPOND · WHO TO CALL';
  return p.category.label.toUpperCase();
}

/* ── stats ───────────────────────────────────────────────────────────────── */

function statsFor(p: Product): Stat[] {
  const s: Stat[] = [];
  if (p.modules?.length)  s.push({ value: String(p.modules.length), label: 'Modules' });
  if (p.pageCount)        s.push({ value: String(p.pageCount),      label: 'Pages'   });
  if (p.trackerCount)     s.push({ value: String(p.trackerCount),   label: 'Trackers' });
  if (p.fileCount)        s.push({ value: String(p.fileCount),      label: 'Files'   });
  if (s.length === 0)     s.push({ value: '1', label: 'Guide' });
  return s.slice(0, 4);
}

function bundleStatsFor(b: Bundle): Stat[] {
  const s: Stat[] = [{ value: String(b.components.length), label: 'Products' }];
  if (b.separatePrice) s.push({ value: `₹${(b.separatePrice - b.price).toLocaleString('en-IN')}`, label: 'You Save' });
  return s;
}

/* ── renderer ────────────────────────────────────────────────────────────── */

async function renderCover(opts: {
  headline: string[];
  accent:   string;
  chip:     string;   // top-left label e.g. "GLOW-UP OS"
  pill:     string;   // module badges text
  tagline:  string;
  stats:    Stat[];
  price:    string;
}): Promise<Buffer> {
  const { headline, accent, chip, pill, tagline, stats, price } = opts;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  /* 1. Background */
  ctx.fillStyle = '#080C1C';
  ctx.fillRect(0, 0, W, H);

  /* Subtle accent radial, top-right */
  const glow = ctx.createRadialGradient(W * 0.80, H * 0.08, 0, W * 0.80, H * 0.08, W * 0.72);
  glow.addColorStop(0, rgba(accent, 0.16));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  /* 2. Left accent bar */
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 8, H);

  /* 3. Product chip (top-left, small coloured label) + price (top-right) */
  const topY = 54;
  ctx.save();
  ctx.font = `700 22px ${BODY}`; ctx.fillStyle = rgba(accent, 0.80);
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText(chip, ML, topY);
  ctx.font = `700 28px ${BODY}`; ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.textAlign = 'right';
  ctx.fillText(price, W - MR, topY);
  ctx.restore();

  /* 4. Module pill badge */
  drawPill(ctx, pill, ML, 108, accent);

  /* 5. Headline */
  const headY = 196;
  const headH = drawHeadline(ctx, headline, accent, ML, headY);

  /* 6. Tagline */
  const descY = headY + headH + 36;
  const descH = drawBody(ctx, tagline, ML, descY, 3);

  /* 7. Stats section */
  const statsTop = Math.max(descY + descH + 56, H * 0.62);
  hRule(ctx, statsTop - 20);
  drawStats(ctx, stats, statsTop, accent);

  /* 8. Price + CTA */
  const priceTop = statsTop + 148;
  hRule(ctx, priceTop - 20);
  ctx.save();
  ctx.font = `900 96px ${DISPLAY}`; ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText(price, ML, priceTop);
  ctx.font = `600 22px ${BODY}`; ctx.fillStyle = rgba(accent, 0.85);
  ctx.textAlign = 'right';
  ctx.fillText('INSTANT DOWNLOAD', W - MR, priceTop + 10);
  ctx.fillText('LIFETIME ACCESS',  W - MR, priceTop + 44);
  ctx.restore();

  /* 9. Bottom wordmark */
  hRule(ctx, H - 86);
  ctx.save();
  ctx.font = `700 21px ${BODY}`; ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText('DROPDESK', ML, H - 50);
  ctx.fillStyle = rgba(accent, 0.42); ctx.textAlign = 'right';
  ctx.fillText('dropdesk.in', W - MR, H - 50);
  ctx.restore();

  return canvas.toBuffer('image/png');
}

/* ── main ────────────────────────────────────────────────────────────────── */

async function main() {
  const argv  = process.argv.slice(2);
  const force = argv.includes('--force');
  const only  = argv.find(a => a.startsWith('--only='))?.slice(7).split(',').filter(Boolean) ?? null;

  const { products, bundles } = fixtureCatalog();
  let wrote = 0, skipped = 0;

  for (const p of products) {
    if (only && !only.includes(p.slug)) { continue; }
    const dir    = join(PUBLIC_DIR, 'products', p.slug);
    const target = join(dir, '1-cover-thumbnail.png');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (existsSync(target) && !force) { skipped++; process.stdout.write(`  ·  products/${p.slug}\n`); continue; }

    const chip = (p.shortTitle ?? p.title).split(' — ')[0].toUpperCase();
    const buf  = await renderCover({
      headline: headlineFor(p),
      accent:   p.accent.hex,
      chip,
      pill:     pillFor(p),
      tagline:  p.tagline.slice(0, 220),
      stats:    statsFor(p),
      price:    `₹${p.price.toLocaleString('en-IN')}`,
    });
    writeFileSync(target, buf);
    wrote++;
    process.stdout.write(`  ✎  products/${p.slug}\n`);
  }

  for (const b of bundles) {
    if (only && !only.includes(b.slug)) { continue; }
    const dir    = join(PUBLIC_DIR, 'bundles', b.slug);
    const target = join(dir, '1-cover-thumbnail.png');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (existsSync(target) && !force) { skipped++; process.stdout.write(`  ·  bundles/${b.slug}\n`); continue; }

    const buf = await renderCover({
      headline: bundleHeadline(b),
      accent:   '#C42B22',
      chip:     'DROPDESK BUNDLE',
      pill:     b.components.slice(0, 4).map(c => c.label.split(' ')[0].toUpperCase()).join(' · '),
      tagline:  b.tagline.slice(0, 220),
      stats:    bundleStatsFor(b),
      price:    `₹${b.price.toLocaleString('en-IN')}`,
    });
    writeFileSync(target, buf);
    wrote++;
    process.stdout.write(`  ✎  bundles/${b.slug}\n`);
  }

  console.log(`\n${wrote} written, ${skipped} skipped.\nOutput: ${PUBLIC_DIR}`);
}

main().catch(e => { console.error(e); process.exit(1); });
