/**
 * Generate cover images for every product and bundle in the catalog.
 *
 * What this writes
 * ────────────────
 *   - One "1-cover-thumbnail.png" per product →  public/products/<slug>/
 *   - One "1-cover-thumbnail.png" per bundle  →  public/bundles/<slug>/
 *   - For guide families (character / parents / ten-series / scam files),
 *     one cover per individual guide AND one for the full set, since the
 *     set's listing copy ships a single cover but the 75 individual guides
 *     use the typographic fallback today.
 *
 * What it draws
 * ─────────────
 *   1200x1600 portrait, dark Ink (#0B1020) background, a left accent bar in
 *   the product's own accent hex, a dashed receipt-style separator, the
 *   category label and a kicker (price + page count), and the title set in
 *   Big Shoulders-style display type. This is the same register-paperwork
 *   language as the storefront's CoverFallback component, so the rendered
 *   covers sit next to a real photo in the same grid without looking like
 *   two different systems.
 *
 *   For guide families and bundles, a textured micro-pattern (thin ruled
 *   lines at 24px spacing in the accent at 14% alpha) sits behind the type,
 *   matching the fallback component's exact treatment.
 *
 *   Each cover also gets a fingerprint strip at the bottom (slug + accent
 *   hex + filename) so we can verify the file we're looking at later.
 *
 * Usage
 * ─────
 *   npx tsx scripts/generate-covers.ts        # generate everything missing
 *   npx tsx scripts/generate-covers.ts --force  # overwrite existing
 *   npx tsx scripts/generate-covers.ts --only=glow-up-os,aura-os
 */
import { createCanvas, registerFont } from 'canvas';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fixtureCatalog } from '../lib/catalog/fixture-source';

type Args = {
  force: boolean;
  only: Set<string> | null;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: Args = { force: false, only: null };
  for (const a of argv) {
    if (a === '--force') args.force = true;
    else if (a.startsWith('--only=')) args.only = new Set(a.slice('--only='.length).split(',').filter(Boolean));
  }
  return args;
}

// Resolve web/public relative to this script: web/scripts/generate-covers.ts
// → ../public (one level up: web/scripts → web, then into web/public)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PUBLIC_DIR = join(__dirname, '..', 'public');

const WIDTH = 1200;
const HEIGHT = 1600;
const INK = '#0B1020';
const INK_SOFT = '#5A6480';
const WHITE = '#FFFFFF';

/* ── Typography ─────────────────────────────────────────────────────────── */

// Next.js ships Geist inside its bundled og package; we register whatever
// variants it has so labels render at the right weight.
const NEXT_OG = join(process.cwd(), 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og');
if (existsSync(join(NEXT_OG, 'Geist-Regular.ttf'))) {
  registerFont(join(NEXT_OG, 'Geist-Regular.ttf'), { family: 'Geist' });
}
if (existsSync(join(NEXT_OG, 'Geist-SemiBold.ttf'))) {
  registerFont(join(NEXT_OG, 'Geist-SemiBold.ttf'), { family: 'Geist', weight: '600' });
}
if (existsSync(join(NEXT_OG, 'Geist-Bold.ttf'))) {
  registerFont(join(NEXT_OG, 'Geist-Bold.ttf'), { family: 'Geist', weight: 'bold' });
}

// Big Shoulders is not bundled; fall back to a system-impact weight via
// canvas's default family. "Impact" is on every Windows / Mac / Linux box,
// and paired with kerning + letter-spacing it reads as the same display
// poster type.
const DISPLAY = 'Impact, "Anton", "Oswald", "Arial Narrow", sans-serif';
const SANS = 'Geist, "Helvetica Neue", Arial, sans-serif';
const MONO = '"Geist Mono", "JetBrains Mono", "Consolas", monospace';

/* ── Drawing primitives ─────────────────────────────────────────────────── */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Horizontal repeating accent lines (the receipt-paper ground). */
function drawGround(ctx: CanvasRenderingContext2D, accent: string, spacing: number) {
  ctx.save();
  ctx.fillStyle = rgba(accent, 0.14);
  for (let y = 0; y < HEIGHT; y += spacing) {
    ctx.fillRect(0, y, WIDTH, 1);
  }
  ctx.restore();
}

/** A 12px wide left accent bar. */
function drawAccentBar(ctx: CanvasRenderingContext2D, accent: string) {
  ctx.save();
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 12, HEIGHT);
  ctx.restore();
}

/** A dashed horizontal separator, the receipt perforation line. */
function drawDashedRule(ctx: CanvasRenderingContext2D, y: number, color = '#FFFFFF') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(60, y);
  ctx.lineTo(WIDTH - 60, y);
  ctx.stroke();
  ctx.restore();
}

/** A solid horizontal rule (used at the top/bottom anchors). */
function drawRule(ctx: CanvasRenderingContext2D, y: number, color = '#FFFFFF') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, y);
  ctx.lineTo(WIDTH - 60, y);
  ctx.stroke();
  ctx.restore();
}

/* ── Text drawing ───────────────────────────────────────────────────────── */

type Align = 'left' | 'right' | 'center';

/**
 * Wrap text into lines that fit within maxWidth. Returns the lines and the
 * line height actually used (which depends on the font size set on ctx).
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const probe = current ? `${current} ${word}` : word;
    if (ctx.measureText(probe).width <= maxWidth) {
      current = probe;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Write a monospaced kicker / label, letter-spaced. */
function drawKicker(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: { size?: number; color?: string; align?: Align } = {},
) {
  const { size = 22, color = 'rgba(255,255,255,0.55)', align = 'left' } = opts;
  ctx.save();
  ctx.font = `600 ${size}px ${MONO}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  // Letter-spacing mimic: draw each glyph individually
  let cursor = align === 'right' ? x : x;
  if (align === 'left') {
    for (const ch of text) {
      ctx.fillText(ch, cursor, y);
      cursor += ctx.measureText(ch).width + size * 0.15;
    }
  } else {
    // For right-align we measure full width and step from the right.
    const widths: number[] = [];
    let total = 0;
    for (const ch of text) {
      const w = ctx.measureText(ch).width;
      widths.push(w);
      total += w + size * 0.15;
    }
    total -= size * 0.15;
    cursor = x - total;
    for (let i = 0; i < text.length; i++) {
      ctx.fillText(text[i], cursor, y);
      cursor += widths[i] + size * 0.15;
    }
  }
  ctx.restore();
}

/** Write the display title — Impact-style poster type, uppercase. */
function drawDisplayTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: { maxWidth: number; size?: number; color?: string; lineHeight?: number } = {},
) {
  const { maxWidth, size = 96, color = WHITE, lineHeight = 0.92 } = opts;
  ctx.save();
  ctx.font = `900 ${size}px ${DISPLAY}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const lines = wrapText(ctx, text.toUpperCase(), maxWidth);
  const lh = size * lineHeight;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lh);
  }
  ctx.restore();
  return lines.length * lh;
}

/* ── Cover composition ──────────────────────────────────────────────────── */

type CoverInput = {
  slug: string;
  title: string;
  shortTitle?: string;
  kicker: string; // category / family label, e.g. "SELF-IMPROVEMENT"
  meta: string; // price + page count
  accent: string;
  isBundle?: boolean;
  variant?: 'default' | 'guide' | 'set';
};

function drawCover(input: CoverInput): Buffer {
  const { title, shortTitle, kicker, meta, accent, variant = 'default' } = input;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background: ink
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // For guide individuals / bundles, the ground lines run full-bleed behind the
  // type. For the main 6 product covers we keep the type on a clean field
  // so the title reads large and confident.
  if (variant !== 'default') {
    drawGround(ctx, accent, 24);
  } else {
    // Subtle ground at half-strength so the cover doesn't read flat
    drawGround(ctx, accent, 32);
  }

  // Left accent bar
  drawAccentBar(ctx, accent);

  // Top rule + kicker row
  drawRule(ctx, 80, 'rgba(255,255,255,0.25)');
  drawKicker(ctx, kicker, 60, 50, { size: 22, color: accent });

  // Tiny "dropdesk cover" stamp top-right
  drawKicker(ctx, 'DROPDESK · COVER', WIDTH - 60, 50, {
    size: 22,
    color: 'rgba(255,255,255,0.35)',
    align: 'right',
  });

  // The meta strip (price + page count) sits below the top rule
  drawKicker(ctx, meta, 60, 110, { size: 24, color: 'rgba(255,255,255,0.7)' });

  // Display title. Cap at 6 lines so very long titles don't overflow the
  // canvas. The title is the whole point — set it big.
  const maxWidth = WIDTH - 120; // 60px gutter each side
  const displayTitle = shortTitle ?? title;
  // For guides (shorter one-line titles) we can set even larger
  const titleSize =
    variant === 'guide' ? 120 : variant === 'set' ? 130 : displayTitle.length > 40 ? 84 : 104;
  // Vertical center the title block in the remaining area
  const linesCount = wrapText(ctx, displayTitle.toUpperCase(), maxWidth).length;
  const lineHeight = titleSize * 0.92;
  const blockHeight = linesCount * lineHeight;
  const startY = (HEIGHT - blockHeight) / 2 - 40;
  drawDisplayTitle(ctx, displayTitle, 60, startY, {
    maxWidth,
    size: titleSize,
    lineHeight: 0.92,
  });

  // Receipt perforation: dashed rule below the title block
  const perfY = Math.min(HEIGHT - 240, startY + blockHeight + 60);
  drawDashedRule(ctx, perfY, 'rgba(255,255,255,0.45)');

  // Below the perforation: a small footer with the slug + accent hex,
  // so we can tell at a glance which cover is which on disk.
  const footerY = perfY + 30;
  drawKicker(ctx, `SLUG · ${input.slug.toUpperCase()}`, 60, footerY, {
    size: 20,
    color: 'rgba(255,255,255,0.45)',
  });
  drawKicker(ctx, `ACCENT · ${accent.toUpperCase()}`, 60, footerY + 36, {
    size: 20,
    color: 'rgba(255,255,255,0.35)',
  });

  // Bottom rule + filename stamp
  drawRule(ctx, HEIGHT - 80, 'rgba(255,255,255,0.25)');
  drawKicker(ctx, '1-COVER-THUMBNAIL.PNG', 60, HEIGHT - 60, {
    size: 20,
    color: 'rgba(255,255,255,0.45)',
  });
  drawKicker(ctx, '1200 × 1600', WIDTH - 60, HEIGHT - 60, {
    size: 20,
    color: 'rgba(255,255,255,0.35)',
    align: 'right',
  });

  return canvas.toBuffer('image/png');
}

/* ── Catalog → cover inputs ──────────────────────────────────────────────── */

function priceMeta(price: number, pageCount?: number, isBundle = false): string {
  const parts: string[] = [`₹${price.toLocaleString('en-IN')}`];
  if (isBundle) parts.push('BUNDLE');
  else if (pageCount) parts.push(`${pageCount} PAGES`);
  return parts.join('  ·  ');
}

function deriveCovers() {
  const { products, bundles } = fixtureCatalog();
  const covers: CoverInput[] = [];

  for (const p of products) {
    const kicker = p.category.label.toUpperCase();
    const meta = priceMeta(p.price, p.pageCount, false);
    let variant: CoverInput['variant'] = 'default';
    // Guide families (category slug starts with their family prefix) get the
    // textured cover so the 75 individual cards read like the same system
    // as the fallback component.
    if (
      p.category.slug === 'character-guides' ||
      p.category.slug === 'talking-to-your-parents' ||
      p.category.slug === 'the-ten-series' ||
      p.category.slug === 'the-scam-files'
    ) {
      variant = p.setSlug ? 'set' : 'guide';
    }
    covers.push({
      slug: p.slug,
      title: p.title,
      shortTitle: p.shortTitle,
      kicker,
      meta,
      accent: p.accent.hex,
      isBundle: false,
      variant,
    });
  }

  for (const b of bundles) {
    covers.push({
      slug: b.slug,
      title: b.title,
      kicker: 'DROPDESK BUNDLE',
      meta: priceMeta(b.price, undefined, true),
      accent: '#C42B22', // brand vermilion — bundles are flagship
      isBundle: true,
      variant: 'default',
    });
  }

  return covers;
}

/* ── Driver ─────────────────────────────────────────────────────────────── */

function ensureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function writeCover(cover: CoverInput, args: Args): 'wrote' | 'skipped' | 'partial' {
  const sub = cover.isBundle ? 'bundles' : 'products';
  const dir = join(PUBLIC_DIR, sub, cover.slug);
  ensureDir(dir);
  const target = join(dir, '1-cover-thumbnail.png');
  if (existsSync(target) && !args.force) return 'skipped';

  const buffer = drawCover(cover);
  writeFileSync(target, buffer);
  return 'wrote';
}

function main() {
  const args = parseArgs();
  const covers = deriveCovers().filter((c) => !args.only || args.only.has(c.slug));

  let wrote = 0;
  let skipped = 0;
  for (const c of covers) {
    const status = writeCover(c, args);
    if (status === 'wrote') wrote++;
    else skipped++;
    const tag = status === 'wrote' ? '✎' : '·';
    console.log(`  ${tag}  ${c.isBundle ? 'bundle' : 'product'}/${c.slug.padEnd(34)}  →  ${c.accent}`);
  }

  console.log(`\n${wrote} written, ${skipped} already on disk.`);
  console.log(`Output: ${PUBLIC_DIR}`);
}

main();