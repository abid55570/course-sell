import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import ReceiptPrint from '@/components/order/ReceiptPrint';

const ORDER = {
  productTitle: 'Glow-Up OS — The Complete System',
  amount: 999,
  orderId: 'ORD-8F2C41A9',
  buyerEmail: 'anas@example.com',
  paidAt: '2026-08-23T10:28:00.000Z',
};

// jsdom has no matchMedia, so the component takes its non-reduced-motion path,
// which is the one worth testing: the timed feed.
describe('ReceiptPrint — the feed', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('holds the printing phase for the whole 2.5s feed', () => {
    render(<ReceiptPrint {...ORDER} />);
    const button = screen.getByRole('button', { name: /printing/i });

    expect(button).toBeDisabled();
    // Still feeding just before the animation ends: offering to tear paper
    // that is still coming out is nonsense.
    act(() => { vi.advanceTimersByTime(2400); });
    expect(screen.getByRole('button', { name: /printing/i })).toBeDisabled();

    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByRole('button', { name: /tear it off/i })).toBeEnabled();
  });

  it('drives the feed and the status light from the same phase', () => {
    const { container } = render(<ReceiptPrint {...ORDER} />);

    expect(container.querySelector('.receipt-paper')).toHaveClass('is-feeding');
    expect(container.querySelector('.receipt-printer-led')).toHaveClass('is-busy');

    act(() => { vi.advanceTimersByTime(2500); });

    expect(container.querySelector('.receipt-paper')).not.toHaveClass('is-feeding');
    expect(container.querySelector('.receipt-printer-led')).not.toHaveClass('is-busy');
  });

  it('does not leave a timer running when unmounted mid-feed', () => {
    const { unmount } = render(<ReceiptPrint {...ORDER} />);
    unmount();
    // A surviving setState on an unmounted component would warn here.
    expect(() => act(() => { vi.advanceTimersByTime(3000); })).not.toThrow();
  });

  it('tears only after the feed, and lands the strip in a modal dialog', () => {
    render(<ReceiptPrint {...ORDER} />);
    act(() => { vi.advanceTimersByTime(2500); });

    fireEvent.click(screen.getByRole('button', { name: /tear it off/i }));
    act(() => { vi.advanceTimersByTime(620); });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName(/ORD-8F2C41A9/);
  });
});

describe('ReceiptPrint — the CSS it depends on', () => {
  // Carriage returns stripped: the stylesheet is CRLF on Windows and every
  // slice below looks for line-anchored braces.
  const CR = String.fromCharCode(13);
  const css = readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8')
    .split(CR).join('');

  it('reveals the strip downward, so the header prints first', () => {
    const feed = css.slice(css.indexOf('@keyframes receipt-feed'));
    const block = feed.slice(0, feed.indexOf('\n}\n') + 3);

    // inset(0 0 <bottom>% 0) shrinking to 0 is a top-down reveal. Sliding the
    // whole sheet instead put the footer through the slot first.
    const insets = [...block.matchAll(/inset\(0 0 ([\d.]+)% 0\)/g)].map((m) => Number(m[1]));
    expect(insets.length).toBeGreaterThan(3);
    expect(insets[0]).toBe(100);
    expect(insets).toEqual([...insets].sort((a, b) => b - a));
  });

  it('bows the paper toward the viewer mid-feed, then flattens it', () => {
    const feed = css.slice(css.indexOf('@keyframes receipt-feed'));
    const block = feed.slice(0, feed.indexOf('\n}\n') + 3);
    // The unit is optional: the resting keyframe is written translateZ(0).
    const z = [...block.matchAll(/translateZ\((-?[\d.]+)(?:px)?\)/g)].map((m) => Number(m[1]));

    expect(Math.max(...z)).toBeGreaterThan(10);
    expect(z.at(-1), 'the strip must end flat against the page').toBe(0);
  });

  it('keeps the judder off the element that runs the feed', () => {
    // Both on one element means the second `animation` silently wins and the
    // paper never arcs. This is the bug in the source animation.
    expect(css).toMatch(/\.receipt-paper\.is-feeding \.receipt-body\s*\{[^}]*receipt-judder/);
    const feedRule = css.match(/\.receipt-paper\.is-feeding\s*\{[^}]*\}/)?.[0] ?? '';
    expect(feedRule).not.toContain('receipt-judder');
  });

  it('stands the sheet still for anyone who asked for less motion', () => {
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduced).toMatch(/\.receipt-paper\.is-feeding\s*\{[^}]*animation:\s*none/);
    expect(reduced).toMatch(/\.receipt-paper\.is-feeding\s*\{[^}]*clip-path:\s*none/);
  });
});
