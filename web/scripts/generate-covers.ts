/**
 * generate-covers.ts  v4  —  design by Fable
 *
 * Selling-psychology improvements over v3:
 *   · Ghost numeral watermark (depth)
 *   · Diagonal accent shard (texture, not flat rectangle)
 *   · Marker-style underline on the accent headline line
 *   · "WHAT'S INSIDE" checklist — kills the dead zone with real data
 *   · Edition tag top-right (collectible framing for guides)
 *   · Anchor price with strike-through when anchorPrice exists
 *   · CTA capsule (full-width accent button — thumb-recognition)
 *   · Proper tagline ellipsis, no mid-word cuts
 *   · Scam-files hazard-stripe variant + helpline number
 *   · Upgraded headlines for scam / parents / ten-series / money-os
 *
 * Usage
 * ─────
 *   npx tsx scripts/generate-covers.ts
 *   npx tsx scripts/generate-covers.ts --force
 *   npx tsx scripts/generate-covers.ts --only=glow-up-os,money-os
 */

import { createCanvas, registerFont } from 'canvas';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixtureCatalog } from '../lib/catalog/fixture-source';
import type { Product, Bundle } from '../lib/catalog/types';

/* ── paths / fonts ───────────────────────────────────────────────────────── */

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const PUBLIC_DIR = join(__dirname, '..', 'public');

const OG = join(process.cwd(), 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'og');
if (existsSync(join(OG, 'Geist-Regular.ttf'))) registerFont(join(OG, 'Geist-Regular.ttf'), { family: 'Geist' });
if (existsSync(join(OG, 'Geist-Bold.ttf')))    registerFont(join(OG, 'Geist-Bold.ttf'),    { family: 'Geist', weight: 'bold' });

const DISPLAY = 'Impact, "Arial Black", sans-serif';
const BODY    = 'Geist, "Helvetica Neue", Arial, sans-serif';

const W = 1200, H = 1600, ML = 64, MR = 64, CW = W - ML - MR;

/* ── colour helper ───────────────────────────────────────────────────────── */

type Ctx = ReturnType<ReturnType<typeof createCanvas>['getContext']>;

function rgba(hex: string, a: number) {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
}

/* ── rounded rect path ───────────────────────────────────────────────────── */

function rrPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

/* ── background layers ───────────────────────────────────────────────────── */

function drawBackground(ctx: Ctx, accent: string, variant: string) {
  // Base
  ctx.fillStyle = '#060A18'; ctx.fillRect(0,0,W,H);

  // Radial glow top-right
  const g = ctx.createRadialGradient(W*0.82,H*0.07,0,W*0.82,H*0.07,W*0.78);
  g.addColorStop(0, rgba(accent, 0.18)); g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  // Diagonal shard
  ctx.save();
  ctx.translate(W,0); ctx.rotate(Math.PI/13);
  ctx.fillStyle = rgba(accent,0.055);
  ctx.fillRect(-180,-200,320,1100);
  ctx.restore();

  // Left accent bar (or hazard stripes for scam variant)
  if (variant === 'scam') {
    const BAR = 10, STRIPE = 28;
    ctx.save(); ctx.beginPath(); ctx.rect(0,0,BAR,H); ctx.clip();
    for (let y = -H; y < H*2; y += STRIPE*2) {
      ctx.fillStyle = accent; ctx.fillRect(0,y,BAR,STRIPE);
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0,y+STRIPE,BAR,STRIPE);
    }
    ctx.restore();
  } else {
    ctx.fillStyle = accent; ctx.fillRect(0,0,8,H);
  }
}

/* ── ghost numeral watermark ─────────────────────────────────────────────── */

function drawGhost(ctx: Ctx, text: string, accent: string) {
  ctx.save();
  ctx.font = `900 540px ${DISPLAY}`;
  ctx.strokeStyle = rgba(accent,0.055);
  ctx.lineWidth = 2;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'right';
  ctx.strokeText(text, W - MR + 24, H * 0.70);
  ctx.restore();
}

/* ── pill badge ──────────────────────────────────────────────────────────── */

function drawPill(ctx: Ctx, text: string, x: number, y: number, accent: string): number {
  const PX = 24, R = 7;
  ctx.font = `600 21px ${BODY}`;
  const tw = ctx.measureText(text).width;
  const pw = Math.min(tw + PX*2, CW), ph = 44;
  ctx.save();
  rrPath(ctx,x,y,pw,ph,R);
  ctx.fillStyle = rgba(accent,0.13); ctx.fill();
  ctx.strokeStyle = rgba(accent,0.45); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = rgba(accent,0.88);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  // Truncate pill text if too wide
  let label = text;
  while (ctx.measureText(label).width > pw - PX*2 && label.includes(' · ')) {
    label = label.split(' · ').slice(0,-1).join(' · ') + ' · …';
  }
  ctx.fillText(label, x+PX, y+ph/2);
  ctx.restore();
  return pw;
}

/* ── headline ────────────────────────────────────────────────────────────── */

type HeadlineResult = { height: number; lastLineW: number; lastLineY: number; fontSize: number };

function drawHeadline(ctx: Ctx, lines: string[], accent: string, x: number, y: number): HeadlineResult {
  let size = lines.length <= 2 ? 184 : 152;
  ctx.font = `900 ${size}px ${DISPLAY}`;
  while (size > 68) {
    ctx.font = `900 ${size}px ${DISPLAY}`;
    if (Math.max(...lines.map(l => ctx.measureText(l).width)) <= CW) break;
    size -= 4;
  }
  const lh = size * 0.90;
  let lastW = 0, lastY = 0;
  lines.forEach((line, i) => {
    ctx.save();
    ctx.font = `900 ${size}px ${DISPLAY}`;
    ctx.fillStyle = i === lines.length-1 ? accent : '#FFFFFF';
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillText(line, x, y + i*lh);
    if (i === lines.length-1) {
      lastW = ctx.measureText(line).width;
      lastY = y + i*lh + size;
    }
    ctx.restore();
  });
  return { height: lines.length*lh, lastLineW: lastW, lastLineY: lastY, fontSize: size };
}

/* ── marker underline ────────────────────────────────────────────────────── */

function drawMarker(ctx: Ctx, x: number, y: number, w: number, accent: string) {
  ctx.save();
  ctx.strokeStyle = rgba(accent,0.45);
  ctx.lineWidth   = 14;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y+8);
  ctx.quadraticCurveTo(x + w*0.5, y+18, x+Math.min(w, CW), y+6);
  ctx.stroke();
  ctx.restore();
}

/* ── body text with proper ellipsis ─────────────────────────────────────── */

function drawBody(ctx: Ctx, text: string, x: number, y: number, maxLines = 2): number {
  const SIZE = 30, LH = SIZE * 1.55;
  ctx.save();
  ctx.font = `400 ${SIZE}px ${BODY}`; ctx.fillStyle = 'rgba(255,255,255,0.60)';
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const probe = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(probe).width <= CW) { cur = probe; }
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  const shown = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    let last = shown[maxLines-1] ?? '';
    while (last && ctx.measureText(last+'…').width > CW) {
      last = last.split(' ').slice(0,-1).join(' ');
    }
    shown[maxLines-1] = last.replace(/[,;:.]$/, '') + '…';
  }
  shown.forEach((l,i) => ctx.fillText(l, x, y + i*LH));
  ctx.restore();
  return shown.length * LH;
}

/* ── "WHAT'S INSIDE" checklist ───────────────────────────────────────────── */

function drawChecklist(ctx: Ctx, items: string[], x: number, y: number, accent: string): number {
  const LABEL_H = 42, ROW_H = 66, BOX = 34, R = 8, TICK_L = 11, TICK_M = 17, TICK_R = 27;
  // Section label
  ctx.save();
  ctx.font = `700 20px ${BODY}`; ctx.fillStyle = rgba(accent,0.70);
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText("WHAT'S INSIDE", x, y);
  ctx.restore();

  const shown = items.slice(0,3);
  shown.forEach((item, i) => {
    const ry = y + LABEL_H + i*ROW_H;
    // Box
    ctx.save();
    rrPath(ctx, x, ry, BOX, BOX, R);
    ctx.fillStyle = rgba(accent,0.13); ctx.fill();
    ctx.strokeStyle = rgba(accent,0.48); ctx.lineWidth = 1.5; ctx.stroke();
    // Tick
    ctx.strokeStyle = accent; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x+TICK_L, ry+BOX/2); ctx.lineTo(x+TICK_M, ry+BOX*0.72); ctx.lineTo(x+TICK_R, ry+BOX*0.28);
    ctx.stroke();
    // Text
    ctx.font = `600 28px ${BODY}`; ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    // Truncate item text
    let label = item;
    const maxW = CW - BOX - 20;
    while (ctx.measureText(label).width > maxW && label.length > 10)
      label = label.slice(0,-4) + '…';
    ctx.fillText(label, x+BOX+16, ry+BOX/2);
    ctx.restore();
  });
  return LABEL_H + shown.length * ROW_H;
}

/* ── horizontal rule ─────────────────────────────────────────────────────── */

function hRule(ctx: Ctx, y: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ML,y); ctx.lineTo(W-MR,y); ctx.stroke();
  ctx.restore();
}

/* ── stats grid ──────────────────────────────────────────────────────────── */

type Stat = { value: string; label: string };

function drawStats(ctx: Ctx, stats: Stat[], y: number, accent: string) {
  const colW = CW / Math.max(stats.length,1);
  stats.forEach((s,i) => {
    const x = ML + i*colW;
    ctx.save();
    ctx.font = `900 68px ${DISPLAY}`; ctx.fillStyle = accent;
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillText(s.value, x, y);
    ctx.font = `600 19px ${BODY}`; ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.fillText(s.label.toUpperCase(), x, y+76);
    ctx.restore();
  });
}

/* ── price block with optional anchor ───────────────────────────────────── */

function drawPriceBlock(ctx: Ctx, price: string, anchor: number|undefined, y: number, accent: string): number {
  let h = 0;
  if (anchor) {
    const anchorStr = `₹${anchor.toLocaleString('en-IN')}`;
    ctx.save();
    ctx.font = `600 28px ${BODY}`; ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillText(anchorStr, ML, y);
    const aw = ctx.measureText(anchorStr).width;
    // Strike-through
    ctx.strokeStyle = rgba(accent,0.6); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ML-4, y+14); ctx.lineTo(ML+aw+4, y+14); ctx.stroke();
    // Save chip right-aligned
    const saveStr = `SAVE ₹${(anchor - parseInt(price.replace(/[₹,]/g,''))).toLocaleString('en-IN')}`;
    ctx.font = `700 19px ${BODY}`;
    const sw = ctx.measureText(saveStr).width + 28;
    rrPath(ctx, W-MR-sw, y, sw, 34, 6);
    ctx.fillStyle = rgba(accent,0.18); ctx.fill();
    ctx.strokeStyle = rgba(accent,0.5); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = accent; ctx.textAlign = 'center';
    ctx.fillText(saveStr, W-MR-sw/2, y+10);
    ctx.restore();
    h = 44;
  }
  // Big price
  ctx.save();
  ctx.font = `900 96px ${DISPLAY}`; ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText(price, ML, y+h);
  ctx.restore();
  return h + 110;
}

/* ── CTA capsule ─────────────────────────────────────────────────────────── */

function drawCTA(ctx: Ctx, text: string, y: number, accent: string): number {
  const H_CAP = 92, R = 46;
  ctx.save();
  rrPath(ctx, ML, y, CW, H_CAP, R);
  ctx.fillStyle = accent; ctx.fill();
  // Scale text to fit
  let size = 34;
  ctx.font = `900 ${size}px ${DISPLAY}`;
  while (ctx.measureText(text).width > CW - 80 && size > 20) { size -= 2; ctx.font = `900 ${size}px ${DISPLAY}`; }
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillText(text, ML + CW/2, y + H_CAP/2);
  ctx.restore();
  return H_CAP;
}

/* ── micro-line ──────────────────────────────────────────────────────────── */

function drawMicro(ctx: Ctx, text: string, y: number) {
  ctx.save();
  ctx.font = `600 20px ${BODY}`; ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.textBaseline = 'top'; ctx.textAlign = 'center';
  ctx.fillText(text, W/2, y);
  ctx.restore();
}

/* ── headline map ────────────────────────────────────────────────────────── */

const HEADLINES: Record<string, string[]> = {
  // Flagship OS
  'glow-up-os':              ['STOP LOOKING', 'AVERAGE'],
  'aura-os':                 ['BECOME THE', "WOMAN THEY", "CAN'T IGNORE"],
  'money-os':                ['THE FIRST', '₹1,000 IS', 'THE HARDEST.'],
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
  // Collections
  'the-character-codex':     ['40 GUIDES.', '1 CODEX.', 'YOUR MOVE.'],
  'talking-to-your-parents-full-set': ['12 SCRIPTS.', 'EVERY HARD', 'CONVERSATION.'],
  'the-ten-series-full-set': ['22 GUIDES.', 'ONE COMPLETE', 'COLLECTION.'],
  'the-scam-files':          ['EVERY SCAM', 'AIMED AT', 'YOU.'],
  // Scam files — protective-truth headlines
  'the-digital-arrest-scam': ['NO POLICE', 'ARRESTS YOU', 'ON VIDEO.'],
  'upi-and-otp-fraud':       ['ONE OTP.', 'ZERO', 'BALANCE.'],
  'the-fake-job-offer':      ['THE JOB', "ISN'T", 'REAL.'],
  'the-task-scam':           ['FREE WORK.', 'ZERO', 'PAY.'],
  'the-loan-app-trap':       ['THE LOAN', "ISN'T A", 'LOAN.'],
  'the-guaranteed-returns-scam': ['GUARANTEED', 'RETURNS?', 'RUN.'],
  'the-matrimonial-and-romance-scam': ['THEY SAID', 'THEY LOVE', 'YOU.'],
  'the-impersonation-machine': ['THEY KNOW', 'YOUR', 'NAME.'],
  'the-scam-shield':         ['THE SHIELD', 'THEY', "WON'T SELL."],
  // Parents — calm, not aggressive
  'telling-your-parents-about-bad-results': ['BAD RESULT.', 'RIGHT', 'WORDS.'],
  'telling-your-parents-something-went-wrong': ['SOMETHING', 'WENT WRONG.', 'WHAT NOW?'],
  'telling-your-parents-you-are-moving-away': ['YOU ARE', 'MOVING.', 'HOW TO TELL.'],
  'telling-your-parents-you-are-not-ready-to-get-married': ['NOT READY.', 'HOW TO', 'SAY IT.'],
  'telling-your-parents-you-want-to-change-your-career': ['DIFFERENT PATH.', 'SAME', 'FAMILY.'],
  'telling-your-parents-you-want-to-move-out': ['YOUR OWN', 'PLACE.', 'THEIR BLESSING.'],
  'telling-your-parents-you-want-to-see-a-therapist': ['YOU NEED', 'HELP.', 'HOW TO TELL.'],
  'being-treated-as-an-adult-in-your-own-home': ['ADULT AT', 'HOME.', 'HOW?'],
  'getting-your-parents-to-see-a-doctor': ['THEY WON\'T', 'GO.', 'UNTIL NOW.'],
  'saying-no-to-your-family-without-losing-them': ['NO.', 'WITHOUT', 'LOSING THEM.'],
  'talking-to-your-parents-about-money': ['THE MONEY', 'TALK THEY', 'AVOID.'],
  'when-your-parents-do-not-approve-of-who-you-are-with': ['THEY DON\'T', 'APPROVE.', 'NOW WHAT?'],
  // Ten-series — verdict format
  'ten-ways-to-be-dangerously-smart': ['10 MOVES.', 'DANGEROUSLY', 'SMART.'],
  '10-ways-to-stop-being-underpaid': ['STOP', 'WORKING FOR', 'LESS.'],
  '10-ways-to-be-dangerously-disciplined': ['DISCIPLINE', "ISN'T BORN.", "IT'S BUILT."],
  '10-ways-to-never-lose-your-temper': ['CALM IS', 'YOUR MOST', 'POWERFUL MOVE.'],
  '10-ways-to-be-impossible-to-manipulate': ['NOBODY', 'PLAYS YOU', 'TWICE.'],
};

function capitalise(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function headlineFor(p: Product): string[] {
  if (HEADLINES[p.slug]) return HEADLINES[p.slug];
  if (p.slug.startsWith('how-to-be-like-')) {
    const name = p.slug.replace('how-to-be-like-','').split('-').map(capitalise).join(' ');
    return name.split(' ').length <= 2
      ? ['HOW TO', 'BE LIKE', name.toUpperCase()]
      : ['HOW TO BE', 'LIKE', name.toUpperCase()];
  }
  if (p.slug.match(/^10-/)) {
    const words = (p.shortTitle ?? p.title).toUpperCase().split(' ');
    const t = Math.ceil(words.length / 3);
    return [words.slice(0,t).join(' '), words.slice(t,t*2).join(' '), words.slice(t*2).join(' ')].filter(Boolean);
  }
  if (p.slug.includes('scam') || p.slug.includes('fraud') || p.slug.includes('trap') || p.slug.includes('arrest')) {
    const words = (p.shortTitle ?? p.title).toUpperCase().split(' ');
    const mid = Math.ceil(words.length/2);
    return [words.slice(0,mid).join(' '), words.slice(mid).join(' ')].filter(Boolean);
  }
  const title = (p.shortTitle ?? p.title).toUpperCase();
  const words = title.split(' ');
  const mid = Math.ceil(words.length/2);
  return [words.slice(0,mid).join(' '), words.slice(mid).join(' ')].filter(Boolean);
}

function bundleHeadline(b: Bundle): string[] {
  const words = b.title.toUpperCase().split(' ');
  const mid = Math.ceil(words.length/2);
  return [words.slice(0,mid).join(' '), words.slice(mid).join(' ')].filter(Boolean);
}

/* ── pill content ────────────────────────────────────────────────────────── */

function pillFor(p: Product): string {
  if (p.modules?.length) return p.modules.map(m => m.title).join(' · ');
  if (p.category.slug === 'character-guides')        return 'MINDSET · HABITS · LIFESTYLE · SPEECH';
  if (p.category.slug === 'talking-to-your-parents') return 'GUIDE · SCRIPTS · TIPS';
  if (p.category.slug === 'the-ten-series')          return '10 THINGS THAT ACTUALLY WORK';
  if (p.category.slug === 'the-scam-files')          return 'WHAT TO SPOT · HOW TO RESPOND · WHO TO CALL';
  return p.category.label.toUpperCase();
}

/* ── checklist content ───────────────────────────────────────────────────── */

function checklistFor(p: Product): string[] {
  if (p.modules?.length) return p.modules.slice(0,3).map(m => `${m.title}  —  ${m.pageCount} pages`);
  const pts = p.bulletPoints ?? [];
  return pts.slice(0,3).map(b => {
    const s = b.replace(/^[^a-zA-Z₹0-9]+/, '');
    return s.length > 52 ? s.slice(0,49) + '…' : s;
  });
}

function bundleChecklist(b: Bundle): string[] {
  return b.components.filter(c => c.inCatalog).slice(0,3).map(c => c.label);
}

/* ── stats ───────────────────────────────────────────────────────────────── */

function statsFor(p: Product): Stat[] {
  const s: Stat[] = [];
  if (p.modules?.length) s.push({ value: String(p.modules.length), label: 'Modules' });
  if (p.pageCount)       s.push({ value: String(p.pageCount),      label: 'Pages'   });
  if (p.trackerCount)    s.push({ value: String(p.trackerCount),   label: 'Trackers' });
  if (p.fileCount)       s.push({ value: String(p.fileCount),      label: 'Files'   });
  if (s.length === 0)    s.push({ value: '1', label: 'Guide' });
  return s.slice(0,4);
}

function bundleStats(b: Bundle): Stat[] {
  const s: Stat[] = [{ value: String(b.components.length), label: 'Products' }];
  if (b.separatePrice) s.push({ value: `₹${(b.separatePrice - b.price).toLocaleString('en-IN')}`, label: 'You Save' });
  return s;
}

/* ── edition tag ─────────────────────────────────────────────────────────── */

function editionFor(p: Product): string {
  if (p.category.slug === 'character-guides')        return 'CHARACTER GUIDE';
  if (p.category.slug === 'talking-to-your-parents') return 'CONVERSATION GUIDE';
  if (p.category.slug === 'the-ten-series')          return 'THE TEN SERIES';
  if (p.category.slug === 'the-scam-files')          return 'SCAM FILES';
  return 'DROPDESK ORIGINAL';
}

/* ── ghost numeral ───────────────────────────────────────────────────────── */

function ghostFor(p: Product): string {
  if (p.category.slug === 'the-ten-series') return '10';
  if (p.modules?.length) return String(p.modules.length);
  if (p.category.slug === 'character-guides') {
    const name = p.slug.replace('how-to-be-like-','');
    return name.charAt(0).toUpperCase();
  }
  return String(p.pageCount ?? p.price).charAt(0);
}

/* ── variant ─────────────────────────────────────────────────────────────── */

function variantFor(p: Product): 'default' | 'parents' | 'scam' {
  if (p.category.slug === 'the-scam-files')          return 'scam';
  if (p.category.slug === 'talking-to-your-parents') return 'parents';
  return 'default';
}

function ctaTextFor(variant: string, p: Product): string {
  if (variant === 'scam')    return 'PROTECT YOUR FAMILY  →';
  if (variant === 'parents') return 'READ BEFORE THE CONVERSATION';
  return 'GET INSTANT ACCESS  →';
}

/* ── helpline for scam files ─────────────────────────────────────────────── */

function helplineFor(p: Product): string | null {
  const lines = p.helplines ?? [];
  if (lines.length === 0) return 'CYBERCRIME HELPLINE  1930';
  return `${lines[0].name.toUpperCase()}  ${lines[0].number}`;
}

/* ── renderer ────────────────────────────────────────────────────────────── */

interface RenderOpts {
  headline:   string[];
  accent:     string;
  chip:       string;
  edition:    string;
  pill:       string;
  tagline:    string;
  checklist:  string[];
  stats:      Stat[];
  price:      string;
  anchor?:    number;
  ctaText:    string;
  ghost:      string;
  variant:    string;
  helpline?:  string | null;
}

async function renderCover(opts: RenderOpts): Promise<Buffer> {
  const { headline, accent, chip, edition, pill, tagline, checklist,
          stats, price, anchor, ctaText, ghost, variant, helpline } = opts;
  const canvas = createCanvas(W,H);
  const ctx    = canvas.getContext('2d');

  /* 1. Background layers (base, glow, shard, accent bar) */
  drawBackground(ctx, accent, variant);

  /* 2. Ghost watermark (behind content) */
  drawGhost(ctx, ghost, accent);

  /* 3. Top: chip (left) + edition (right) */
  const topY = 56;
  ctx.save();
  ctx.font = `700 22px ${BODY}`; ctx.fillStyle = rgba(accent,0.80);
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText(chip, ML, topY);
  ctx.font = `600 20px ${BODY}`; ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.textAlign = 'right';
  ctx.fillText(edition, W-MR, topY);
  ctx.restore();

  /* 4. Pill badge */
  drawPill(ctx, pill, ML, 112, accent);

  /* 5. Headline */
  const headY = 198;
  const hInfo = drawHeadline(ctx, headline, accent, ML, headY);

  /* 6. Marker underline on accent line */
  drawMarker(ctx, ML, hInfo.lastLineY + 8, Math.min(hInfo.lastLineW, CW), accent);

  /* 7. Tagline */
  const descY = headY + hInfo.height + 44;
  const descH = drawBody(ctx, tagline, ML, descY, 2);

  /* 8. Checklist */
  const listY = descY + descH + 52;
  const listH = drawChecklist(ctx, checklist, ML, listY, accent);

  /* 9. Stats */
  const statsY = listY + listH + 36;
  hRule(ctx, statsY - 16);
  drawStats(ctx, stats, statsY, accent);

  /* 10. Price block */
  const priceY = statsY + 128;
  hRule(ctx, priceY - 16);
  const priceH = drawPriceBlock(ctx, price, anchor, priceY, accent);

  /* 11. CTA capsule */
  const ctaY = priceY + priceH + 12;
  drawCTA(ctx, ctaText, ctaY, accent);

  /* 12. Micro-line */
  const microY = ctaY + 92 + 20;
  drawMicro(ctx, 'PDF  ·  INSTANT DOWNLOAD  ·  LIFETIME ACCESS', microY);

  /* 13. Helpline (scam variant only) */
  if (variant === 'scam' && helpline) {
    ctx.save();
    ctx.font = `600 19px ${BODY}`; ctx.fillStyle = rgba(accent, 0.55);
    ctx.textBaseline = 'bottom'; ctx.textAlign = 'left';
    ctx.fillText(helpline, ML, H - 90);
    ctx.restore();
  }

  /* 14. Bottom wordmark */
  hRule(ctx, H-82);
  ctx.save();
  ctx.font = `700 21px ${BODY}`; ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText('DROPDESK', ML, H-48);
  ctx.fillStyle = rgba(accent,0.40); ctx.textAlign = 'right';
  ctx.fillText('dropdesk.in', W-MR, H-48);
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
    if (only && !only.includes(p.slug)) continue;
    const dir    = join(PUBLIC_DIR, 'products', p.slug);
    const target = join(dir, '1-cover-thumbnail.png');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (existsSync(target) && !force) { skipped++; process.stdout.write(`  ·  products/${p.slug}\n`); continue; }

    const variant = variantFor(p);
    const buf = await renderCover({
      headline:  headlineFor(p),
      accent:    p.accent.hex,
      chip:      (p.shortTitle ?? p.title).split(' — ')[0].toUpperCase(),
      edition:   editionFor(p),
      pill:      pillFor(p),
      tagline:   p.tagline,
      checklist: checklistFor(p),
      stats:     statsFor(p),
      price:     `₹${p.price.toLocaleString('en-IN')}`,
      anchor:    p.anchorPrice,
      ctaText:   ctaTextFor(variant, p),
      ghost:     ghostFor(p),
      variant,
      helpline:  variant === 'scam' ? helplineFor(p) : null,
    });
    writeFileSync(target, buf);
    wrote++;
    process.stdout.write(`  ✎  products/${p.slug}\n`);
  }

  for (const b of bundles) {
    if (only && !only.includes(b.slug)) continue;
    const dir    = join(PUBLIC_DIR, 'bundles', b.slug);
    const target = join(dir, '1-cover-thumbnail.png');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (existsSync(target) && !force) { skipped++; process.stdout.write(`  ·  bundles/${b.slug}\n`); continue; }

    const buf = await renderCover({
      headline:  bundleHeadline(b),
      accent:    '#C42B22',
      chip:      'DROPDESK BUNDLE',
      edition:   'COMPLETE BUNDLE',
      pill:      b.components.slice(0,4).map(c => c.label.split(' ')[0].toUpperCase()).join(' · '),
      tagline:   b.tagline,
      checklist: bundleChecklist(b),
      stats:     bundleStats(b),
      price:     `₹${b.price.toLocaleString('en-IN')}`,
      anchor:    b.separatePrice,
      ctaText:   'GET THE BUNDLE  →',
      ghost:     String(b.components.length),
      variant:   'default',
    });
    writeFileSync(target, buf);
    wrote++;
    process.stdout.write(`  ✎  bundles/${b.slug}\n`);
  }

  console.log(`\n${wrote} written, ${skipped} skipped.\nOutput: ${PUBLIC_DIR}`);
}

main().catch(e => { console.error(e); process.exit(1); });
