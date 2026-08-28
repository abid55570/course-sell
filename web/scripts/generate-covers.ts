/**
 * Generate cover images for every product and bundle.
 *
 * v2: real Unsplash photo backgrounds with dark gradient overlays,
 * so covers look like actual product thumbnails rather than typography
 * rendered on a flat background.
 *
 * Design
 * ──────
 *   1200×1600 portrait
 *   · Unsplash photo, full-bleed, scaled to cover
 *   · Dark gradient overlay: 45% opacity at top → 97% at bottom
 *   · 10px left accent bar in the product's own accent hex
 *   · Category label + price (top, monospace)
 *   · Product name (large Impact, lower third)
 *   · Subtitle / tagline line  (mono, smaller)
 *   · Key stats row  (pages, trackers)
 *   · DROPDESK wordmark (bottom)
 *
 * Usage
 * ─────
 *   npx tsx scripts/generate-covers.ts          # skip existing
 *   npx tsx scripts/generate-covers.ts --force  # overwrite all
 *   npx tsx scripts/generate-covers.ts --only=glow-up-os,aura-os
 *
 * Unsplash photos are cached in scripts/.photo-cache/ so subsequent
 * runs do not re-fetch. Delete the cache to get fresh photos.
 */

import { createCanvas, loadImage, registerFont } from 'canvas';
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixtureCatalog } from '../lib/catalog/fixture-source';
import type { Product, Bundle } from '../lib/catalog/types';

/* ── env / paths ─────────────────────────────────────────────────────────── */

// Load .env from repo root so UNSPLASH_ACCESS_KEY is available
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: join(process.cwd(), '..', '.env') });
dotenvConfig({ path: join(process.cwd(), '.env.local') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PUBLIC_DIR = join(__dirname, '..', 'public');
const PHOTO_CACHE = join(__dirname, '.photo-cache');
if (!existsSync(PHOTO_CACHE)) mkdirSync(PHOTO_CACHE, { recursive: true });

/* ── canvas dims ─────────────────────────────────────────────────────────── */

const W = 1200;
const H = 1600;
const INK = '#0B1020';

/* ── font registration ───────────────────────────────────────────────────── */

const NEXT_OG = join(process.cwd(), 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og');
if (existsSync(join(NEXT_OG, 'Geist-Regular.ttf'))) {
  registerFont(join(NEXT_OG, 'Geist-Regular.ttf'), { family: 'Geist' });
}
if (existsSync(join(NEXT_OG, 'Geist-Bold.ttf'))) {
  registerFont(join(NEXT_OG, 'Geist-Bold.ttf'), { family: 'Geist', weight: 'bold' });
}

const DISPLAY = 'Impact, "Arial Black", sans-serif';
const MONO = 'Geist, "Courier New", monospace';

/* ── Unsplash photo fetching ─────────────────────────────────────────────── */

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY ?? '';

async function fetchPhotoBuffer(query: string): Promise<Buffer | null> {
  if (!UNSPLASH_KEY) {
    console.warn('  ⚠  UNSPLASH_ACCESS_KEY not set — using flat background');
    return null;
  }

  const cacheKey = query.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 80);
  const cachePath = join(PHOTO_CACHE, `${cacheKey}.jpg`);

  if (existsSync(cachePath)) {
    return readFileSync(cachePath);
  }

  try {
    const apiUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=portrait&content_filter=high`;
    const apiRes = await fetch(apiUrl, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    });
    if (!apiRes.ok) {
      console.warn(`  ⚠  Unsplash API ${apiRes.status} for "${query}"`);
      return null;
    }
    const data = (await apiRes.json()) as { urls: { regular: string }; id: string };
    const imgRes = await fetch(data.urls.regular);
    if (!imgRes.ok) return null;
    const buf = Buffer.from(await imgRes.arrayBuffer());
    writeFileSync(cachePath, buf);

    // Track download per Unsplash guidelines
    await fetch(`https://api.unsplash.com/photos/${data.id}/download`, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    }).catch(() => {});

    return buf;
  } catch (e) {
    console.warn(`  ⚠  photo fetch failed for "${query}": ${(e as Error).message}`);
    return null;
  }
}

/* ── drawing helpers ─────────────────────────────────────────────────────── */

type Ctx = ReturnType<ReturnType<typeof createCanvas>['getContext']>;

function hexToRgba(hex: string, a: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function drawPhotoBackground(ctx: Ctx, photo: import('canvas').Image | null, accent: string) {
  if (photo) {
    // Scale to cover
    const scale = Math.max(W / photo.width, H / photo.height);
    const dw = photo.width * scale;
    const dh = photo.height * scale;
    const dx = (W - dw) / 2;
    const dy = (H - dh) / 2;
    ctx.drawImage(photo as any, dx, dy, dw, dh);
  } else {
    // Fallback: ink + subtle accent grain
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = hexToRgba(accent, 0.08);
    for (let y = 0; y < H; y += 28) ctx.fillRect(0, y, W, 1);
  }
}

function drawGradientOverlay(ctx: Ctx, hasPhoto: boolean) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (hasPhoto) {
    g.addColorStop(0,    'rgba(11,16,32,0.50)');
    g.addColorStop(0.38, 'rgba(11,16,32,0.55)');
    g.addColorStop(0.62, 'rgba(11,16,32,0.82)');
    g.addColorStop(0.80, 'rgba(11,16,32,0.94)');
    g.addColorStop(1,    'rgba(11,16,32,0.98)');
  } else {
    g.addColorStop(0, 'rgba(11,16,32,0.0)');
    g.addColorStop(1, 'rgba(11,16,32,0.0)');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawAccentBar(ctx: Ctx, accent: string) {
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 10, H);
}

function wrapText(ctx: Ctx, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const probe = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(probe).width <= maxW) { cur = probe; }
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Letter-spaced monospace label. */
function drawLabel(ctx: Ctx, text: string, x: number, y: number, opts: {
  size?: number; color?: string; align?: CanvasTextAlign;
} = {}) {
  const { size = 22, color = 'rgba(255,255,255,0.55)', align = 'left' } = opts;
  ctx.save();
  ctx.font = `600 ${size}px ${MONO}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  // Simulate letter-spacing by spacing out individual characters
  const gap = size * 0.12;
  if (align === 'left') {
    let cx = x;
    for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + gap; }
  } else {
    // measure total width first
    let total = 0;
    const chars = [...text];
    const widths = chars.map(c => { const w = ctx.measureText(c).width; total += w + gap; return w; });
    total -= gap;
    let cx = align === 'right' ? x - total : x - total / 2;
    chars.forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += widths[i] + gap; });
  }
  ctx.restore();
}

/** Solid 1px horizontal rule. */
function drawRule(ctx: Ctx, y: number, color = 'rgba(255,255,255,0.22)') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(56, y); ctx.lineTo(W - 56, y);
  ctx.stroke();
  ctx.restore();
}

/** Dashed receipt-style rule. */
function drawDash(ctx: Ctx, y: number, accent: string) {
  ctx.save();
  ctx.strokeStyle = hexToRgba(accent, 0.6);
  ctx.lineWidth = 2;
  ctx.setLineDash([9, 7]);
  ctx.beginPath();
  ctx.moveTo(56, y); ctx.lineTo(W - 56, y);
  ctx.stroke();
  ctx.restore();
}

/** Large display title, returns height used. */
function drawTitle(ctx: Ctx, text: string, x: number, y: number, opts: {
  maxW: number; size?: number; lineHeight?: number;
} = { maxW: W - 112 }): number {
  const { maxW, size = 104, lineHeight = 0.9 } = opts;
  ctx.save();
  ctx.font = `900 ${size}px ${DISPLAY}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const lines = wrapText(ctx, text.toUpperCase(), maxW);
  const lh = size * lineHeight;
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
  ctx.restore();
  return lines.length * lh;
}

/* ── cover input type ────────────────────────────────────────────────────── */

type CoverInput = {
  slug: string;
  name: string;       // Main title line (short — product name only)
  subtitle?: string;  // Below the name (e.g. "Body · Looks & Mind")
  category: string;   // Category label
  price: string;      // e.g. "₹999"
  stats: string;      // e.g. "39 PAGES  ·  5 TRACKERS"
  accent: string;
  photoQuery: string;
  isBundle: boolean;
};

/* ── cover renderer ──────────────────────────────────────────────────────── */

async function renderCover(input: CoverInput): Promise<Buffer> {
  const { name, subtitle, category, price, stats, accent, photoQuery } = input;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // 1. Photo background
  const photoBuf = await fetchPhotoBuffer(photoQuery);
  const photo = photoBuf ? await loadImage(photoBuf) : null;
  drawPhotoBackground(ctx, photo, accent);

  // 2. Gradient overlay
  drawGradientOverlay(ctx, !!photo);

  // 3. Left accent bar
  drawAccentBar(ctx, accent);

  // 4. Top strip — category label (left) + price (right)
  const topY = 52;
  drawLabel(ctx, category.toUpperCase(), 60, topY, { size: 20, color: accent });
  drawLabel(ctx, price, W - 60, topY, { size: 24, color: 'rgba(255,255,255,0.9)', align: 'right' });
  drawRule(ctx, topY + 40);

  // 5. Lower content block — placed in bottom 48% of canvas
  const CONTENT_TOP = H * 0.52;

  // Dashed separator above content
  drawDash(ctx, CONTENT_TOP - 28, accent);

  // Product name (large Impact)
  // Auto-size: if name is very long, shrink
  const titleSize = name.length > 22 ? (name.length > 34 ? 76 : 88) : 108;
  const titleH = drawTitle(ctx, name, 60, CONTENT_TOP, {
    maxW: W - 112,
    size: titleSize,
    lineHeight: 0.9,
  });

  let cursorY = CONTENT_TOP + titleH + 20;

  // Subtitle (e.g. "Body · Looks & Mind")
  if (subtitle) {
    drawLabel(ctx, subtitle.toUpperCase(), 60, cursorY, {
      size: 26,
      color: hexToRgba(accent, 0.95),
    });
    cursorY += 44;
  }

  // Stats row
  if (stats) {
    cursorY += 8;
    drawLabel(ctx, stats, 60, cursorY, { size: 22, color: 'rgba(255,255,255,0.55)' });
    cursorY += 36;
  }

  // Bottom rule + DROPDESK wordmark
  drawRule(ctx, H - 72);
  drawLabel(ctx, 'DROPDESK', 60, H - 54, { size: 20, color: 'rgba(255,255,255,0.4)' });
  drawLabel(ctx, '↗  dropdesk.in', W - 60, H - 54, {
    size: 20,
    color: hexToRgba(accent, 0.55),
    align: 'right',
  });

  return canvas.toBuffer('image/png');
}

/* ── catalog → cover inputs ──────────────────────────────────────────────── */

// Unsplash search terms per product slug or family prefix
const PHOTO_QUERIES: Record<string, string> = {
  // Self-improvement
  'glow-up-os':           'male fitness gym dark dramatic moody portrait',
  'aura-os':              'woman confident beauty wellness dark portrait',
  'skin-os':              'skincare beauty dark aesthetic minimal',
  'sleep-os':             'sleep bedroom calm dark night minimal',
  'home-workout-os':      'home workout exercise dark dramatic',
  'gym-beginner-os':      'gym weights lifting dark dramatic portrait',
  'wedding-glow-up-os':   'wedding celebration bokeh lights dark',

  // Money & career
  'money-os':             'laptop night work dark moody freelance',
  'career-os':            'professional businessman dark suit portrait',
  'money-habits-os':      'money finance savings dark minimal',
  'english-confidence-os':'speaking stage microphone dark confidence',

  // Study
  'study-os':             'books studying dark minimal night lamp',
  'thirty-days-of-focus': 'focus concentration dark meditation minimal',
  'exam-sprint-os':       'exam studying night dark pencil paper',

  // Creator & social
  'social-os':            'conversation friends talking dark moody',
  'creator-os':           'content creator camera dark studio',
  'presence-os':          'stage spotlight dark dramatic confidence',

  // Guide families (shared per family)
  '__character':          'dark dramatic silhouette portrait moody cinematic',
  '__parents':            'family warmth connection dark emotional',
  '__ten-series':         'dark minimal abstract typographic dramatic',
  '__scam':               'cybersecurity hacker dark screen warning digital',
  '__tripwire':           'dark minimal dramatic abstract',

  // Bundles
  '__bundle':             'dark premium collection minimal elegant',
};

function photoQueryFor(slug: string, category: string): string {
  if (PHOTO_QUERIES[slug]) return PHOTO_QUERIES[slug];
  if (category === 'character-guides')       return PHOTO_QUERIES['__character'];
  if (category === 'talking-to-your-parents') return PHOTO_QUERIES['__parents'];
  if (category === 'the-ten-series')         return PHOTO_QUERIES['__ten-series'];
  if (category === 'the-scam-files')         return PHOTO_QUERIES['__scam'];
  return PHOTO_QUERIES['__tripwire'];
}

function splitTitle(title: string): { name: string; subtitle?: string } {
  const sep = title.indexOf(' — ');
  if (sep === -1) return { name: title };
  return { name: title.slice(0, sep), subtitle: title.slice(sep + 3) };
}

function statsLine(p: Product): string {
  const parts: string[] = [];
  if (p.pageCount) parts.push(`${p.pageCount} PAGES`);
  if (p.trackerCount) parts.push(`${p.trackerCount} TRACKERS`);
  if (p.fileCount && !p.pageCount) parts.push(`${p.fileCount} FILES`);
  return parts.join('  ·  ');
}

function productToInput(p: Product): CoverInput {
  const { name, subtitle } = splitTitle(p.shortTitle ?? p.title);
  return {
    slug: p.slug,
    name,
    subtitle,
    category: p.category.label,
    price: `₹${p.price.toLocaleString('en-IN')}`,
    stats: statsLine(p),
    accent: p.accent.hex,
    photoQuery: photoQueryFor(p.slug, p.category.slug),
    isBundle: false,
  };
}

function bundleToInput(b: Bundle): CoverInput {
  const { name, subtitle } = splitTitle(b.title);
  const totalPages = b.components
    .filter(c => c.inCatalog)
    .reduce((sum) => sum, 0); // just use the tagline stat
  return {
    slug: b.slug,
    name,
    subtitle,
    category: 'DROPDESK BUNDLE',
    price: `₹${b.price.toLocaleString('en-IN')}`,
    stats: b.separatePrice
      ? `SAVES ₹${(b.separatePrice - b.price).toLocaleString('en-IN')}  ·  ${b.components.length} PRODUCTS`
      : `${b.components.length} PRODUCTS`,
    accent: '#C42B22',
    photoQuery: PHOTO_QUERIES['__bundle'],
    isBundle: true,
  };
}

/* ── args / driver ───────────────────────────────────────────────────────── */

type Args = { force: boolean; only: Set<string> | null };

function parseArgs(): Args {
  const args: Args = { force: false, only: null };
  for (const a of process.argv.slice(2)) {
    if (a === '--force') args.force = true;
    else if (a.startsWith('--only='))
      args.only = new Set(a.slice('--only='.length).split(',').filter(Boolean));
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const { products, bundles } = fixtureCatalog();

  const inputs: CoverInput[] = [
    ...products.map(productToInput),
    ...bundles.map(bundleToInput),
  ].filter(c => !args.only || args.only.has(c.slug));

  console.log(`\nGenerating ${inputs.length} covers  (force=${args.force})\n`);

  // Pre-fetch unique photos (one per unique photoQuery) so we don't spam the API
  const uniqueQueries = [...new Set(inputs.map(i => i.photoQuery))];
  console.log(`Fetching ${uniqueQueries.length} unique Unsplash photos...\n`);
  for (const q of uniqueQueries) {
    await fetchPhotoBuffer(q);
  }

  let wrote = 0; let skipped = 0;

  for (const input of inputs) {
    const sub = input.isBundle ? 'bundles' : 'products';
    const dir = join(PUBLIC_DIR, sub, input.slug);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const target = join(dir, '1-cover-thumbnail.png');

    if (existsSync(target) && !args.force) {
      skipped++;
      process.stdout.write(`  ·  ${sub}/${input.slug}\n`);
      continue;
    }

    const buf = await renderCover(input);
    writeFileSync(target, buf);
    wrote++;
    process.stdout.write(`  ✎  ${sub}/${input.slug}\n`);
  }

  console.log(`\n${wrote} written, ${skipped} skipped.`);
  console.log(`Output: ${PUBLIC_DIR}`);
  if (!UNSPLASH_KEY) {
    console.log('\n⚠  Set UNSPLASH_ACCESS_KEY in .env to enable photo backgrounds.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
