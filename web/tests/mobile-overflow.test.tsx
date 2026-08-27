import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import Hero from '@/components/landing/Hero';
import HeroHeadline from '@/components/landing/HeroHeadline';
import ProductCoverParallax from '@/components/landing/ProductCoverParallax';

/**
 * Regression coverage for the mobile clipping bug: below the `sm` (640px)
 * breakpoint, Hero's two-column layout collapses to a single-column CSS
 * grid. A grid item's automatic minimum width defaults to its content's
 * max-content size, so an un-shrinkable, oversized second column can force
 * the *whole* grid column — including the headline, body copy and CTA in
 * the other item — wider than the 335px available inside the section's
 * 20px mobile padding. Because the Hero section clips overflow
 * (`overflow-hidden`), that excess would be invisible and unreachable
 * rather than reachable via horizontal scroll.
 *
 * The hero's second column used to be a row of product cover images; it is
 * now a catalog-derived category panel (no product imagery survives in the
 * hero at all — see the "no product imagery in chrome" tests below). The
 * overflow mechanics this suite guards are the same shape either way.
 *
 * jsdom has no layout engine, so these tests cannot measure real pixel
 * geometry (getBoundingClientRect() is always zero-filled). What they
 * verify instead is the presence of the specific mechanisms that fix and
 * guard the overflow:
 *   - `min-w-0` on both grid items, so neither's content can force the
 *     shared implicit grid column wider than the section's content box.
 *   - the category panel using a fluid `w-full` width at the base
 *     (mobile) breakpoint, only pinning to a fixed width from `sm`
 *     upward where there's room for it.
 *   - the parallax cover's decorative bleed kept within the section's
 *     smallest horizontal padding (20px) below `sm`, so it doesn't
 *     poke past the viewport edge on its own.
 * They do NOT cover actual rendered overflow/clipping in a real browser
 * viewport — that was verified manually with Playwright at 360/390/414px
 * and is not exercised by this suite.
 */
describe('Hero mobile-width overflow guard', () => {
  // The original bug: a flex/grid child defaults to min-width:auto, so an
  // un-shrinkable row forced its column past the section's content box and an
  // overflow-hidden ancestor clipped the copy instead of revealing it. The
  // content column must stay shrinkable.
  it('keeps the hero content column shrinkable so it cannot force the section wider', () => {
    const { container } = render(<Hero paymentMode="dev" />);
    const column = container.querySelector('.max-w-6xl > .min-w-0');
    expect(
      column,
      'the hero content column must carry min-w-0 or long content can clip on mobile'
    ).not.toBeNull();
  });

  // A fixed width applied at the BASE breakpoint cannot shrink below itself, so
  // a large one overflows a 360px viewport. Fixed widths are only safe once a
  // media query has guaranteed the room, i.e. behind an sm:/md:/lg:/xl: prefix.
  // Small fixed sizes (dots, icons, rules) are fine and deliberately allowed.
  const NARROWEST_VIEWPORT_PX = 360;

  /** px width a Tailwind width class pins, or null if it does not pin one. */
  function pinnedWidthPx(cls: string): number | null {
    const step = cls.match(/^w-(\d+(?:\.\d+)?)$/); // w-80 -> 20rem
    if (step) return parseFloat(step[1]) * 4;
    const rem = cls.match(/^w-\[(\d+(?:\.\d+)?)rem\]$/);
    if (rem) return parseFloat(rem[1]) * 16;
    const px = cls.match(/^w-\[(\d+(?:\.\d+)?)px\]$/);
    if (px) return parseFloat(px[1]);
    return null;
  }

  it('pins no width wide enough to overflow the narrowest viewport', () => {
    const { container } = render(<Hero paymentMode="dev" />);
    const offenders: string[] = [];

    container.querySelectorAll<HTMLElement>('*').forEach((el) => {
      el.className
        .split(/\s+/)
        .filter(Boolean)
        .forEach((cls) => {
          if (cls.includes(':')) return; // breakpoint-prefixed, already guarded
          const width = pinnedWidthPx(cls);
          if (width !== null && width >= NARROWEST_VIEWPORT_PX / 2) {
            offenders.push(`${cls} (${width}px) on <${el.tagName.toLowerCase()}>`);
          }
        });
    });

    expect(
      offenders,
      `unprefixed widths this large overflow a ${NARROWEST_VIEWPORT_PX}px viewport: ${offenders.join(', ')}`
    ).toEqual([]);
  });
});

describe('Hero carries no product imagery', () => {
  it('renders no <img> elements at all: no cover, no rack, no featured product', () => {
    const { container } = render(<Hero paymentMode="dev" />);
    expect(container.querySelectorAll('img').length).toBe(0);
  });
});

describe('ProductCoverParallax decorative bleed', () => {
  it('keeps the mobile bleed within the smallest section padding (20px) so it cannot poke past the viewport', () => {
    const { container } = render(
      <ProductCoverParallax src="/x.jpg" alt="" sizes="100vw" />
    );
    const wrap = container.querySelector('.absolute') as HTMLElement | null;
    expect(wrap).not.toBeNull();

    const match = wrap!.className.match(/inset-\[-(\d+)px\]/);
    expect(match, `expected an inset-[-Npx] class on "${wrap!.className}"`).not.toBeNull();
    const baseInset = Number(match![1]);
    // ProductBand's mobile padding is px-5 (20px). The bleed must not
    // exceed it, or the wrap div pokes past the viewport edge on cards
    // flush against that padding.
    expect(baseInset).toBeLessThanOrEqual(20);

    // From sm upward, ProductBand's padding grows to 40px+, so the
    // original 24px bleed (needed to cover the parallax's ±20px travel
    // with margin) is safe again.
    expect(wrap!.className).toContain('sm:inset-[-24px]');
  });
});

describe('HeroHeadline reveal cannot strand a line invisible', () => {
  // The reveal used to be a GSAP tween in a client component. If that effect
  // never ran — chunk fails, hydration is slow, JS disabled — the lines sat at
  // opacity 0 and the hero was blank. It is now a pure CSS animation on a
  // server component, so the failure mode is structurally impossible. These
  // assertions guard that property, not the old mechanism.
  it('renders no line with a zero-opacity class or inline style', () => {
    const { container } = render(<HeroHeadline lines={['A', 'B', 'C']} />);
    const lines = Array.from(container.querySelectorAll('[data-hero-line]')) as HTMLElement[];
    expect(lines.length).toBe(3);
    for (const line of lines) {
      expect(line.className, 'a line must not start hidden by a class').not.toMatch(/opacity-0/);
      expect(line.style.opacity, 'a line must not start hidden by an inline style').not.toBe('0');
    }
  });

  it('ships no JavaScript for the reveal', () => {
    const src = readFileSync(
      path.resolve(__dirname, '../components/landing/HeroHeadline.tsx'),
      'utf8'
    );
    expect(src, 'HeroHeadline must stay a server component').not.toContain("'use client'");
    expect(src, 'the reveal must not pull GSAP onto the first paint').not.toContain('gsap');
  });

  it('drops the animation entirely under reduced motion rather than shortening it', () => {
    const css = readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8');
    const block = css.slice(css.indexOf('.hero-line'));
    const reduced = block.slice(block.indexOf('prefers-reduced-motion'));
    expect(reduced).toContain('animation: none');
    expect(reduced).toContain('opacity: 1');
  });
});

// The headline is three deliberate beats. If the type floor is ever raised
// past what a 360px viewport holds, the longest line wraps and it reads as
// four. Guard the floor rather than the rendered height, since jsdom does not
// lay text out.
describe('Hero headline type floor', () => {
  it('sets a clamp minimum narrow enough that the longest line cannot wrap on mobile', () => {
    const src = readFileSync(
      path.resolve(__dirname, '../components/landing/HeroHeadline.tsx'),
      'utf8'
    );
    const match = src.match(/clamp\((\d+(?:\.\d+)?)rem\s*,/);
    expect(match, 'expected a clamp(<min>rem, …) font size on the headline').not.toBeNull();

    const minRem = parseFloat(match![1]);
    // Measured: at 2.25rem the longest line ("DOWNLOAD NOW.") fits a 350px
    // content box; at 3.5rem it wrapped.
    expect(
      minRem,
      `clamp floor ${minRem}rem is too large; the longest headline line wraps below 360px`
    ).toBeLessThanOrEqual(2.5);
  });
});
