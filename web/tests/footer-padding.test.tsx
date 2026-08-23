import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

/**
 * Regression guard for the /checkout and /order/[id] horizontal-overflow
 * bug: both wrapped <Footer /> inside a <main> that carried its own
 * px-5 sm:px-10 lg:px-16, and Footer.tsx applies its own px-5 ...
 * sm:pl-20 sm:pr-12 -- nested, the two paddings stacked and the page
 * scrolled horizontally at 360/390/414px (measured live: clientWidth 345,
 * scrollWidth 351).
 *
 * jsdom has no layout engine, so this can't measure real pixel overflow
 * (that was verified with a live browser at 360/390/414px on /,
 * /checkout?slug=glow-up-os, /order/ORD-TEST, /products and /p/glow-up-os).
 * What this guards structurally: no ancestor between <main> and Footer's
 * own <footer> element carries a horizontal-padding utility class, which is
 * exactly the shape of nesting that caused the stacking. Every other route
 * (/, /products, /p/[slug], /bundle/[slug], /category/[slug]) already
 * renders <Footer /> as an unpadded child of <main>, with padding scoped to
 * an inner content wrapper instead -- this is that same shape.
 */

function hasHorizontalPadding(className: string) {
  return className
    .split(/\s+/)
    .some((cls) => /^(?:[a-z0-9-]+:)?p[xlr]-/.test(cls));
}

function assertNoAncestorHorizontalPadding(footer: HTMLElement) {
  let node: HTMLElement | null = footer.parentElement;
  while (node && node.tagName !== 'BODY') {
    expect(
      hasHorizontalPadding(node.className),
      `ancestor <${node.tagName.toLowerCase()} class="${node.className}"> of <footer> must not carry horizontal padding -- it would stack with Footer's own px-5 .../sm:pl-20 sm:pr-12`
    ).toBe(false);
    node = node.parentElement;
  }
}

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'ORD-TEST' }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/orders', () => ({
  // Never resolves -- the page renders its 'loading' state, which is enough
  // to check the Shell/Footer nesting (identical across every state).
  getOrder: () => new Promise(() => {}),
}));

import CheckoutPage from '@/app/checkout/page';
import OrderStatusPage from '@/app/order/[id]/page';

describe('Footer is never nested inside a padded ancestor', () => {
  it('/checkout: no ancestor of <footer> carries horizontal padding', async () => {
    const Page = await CheckoutPage({ searchParams: Promise.resolve({ slug: 'glow-up-os' }) });
    const { container } = render(Page);
    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();
    assertNoAncestorHorizontalPadding(footer as HTMLElement);
  });

  it('/order/[id]: no ancestor of <footer> carries horizontal padding', () => {
    const { container } = render(<OrderStatusPage />);
    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();
    assertNoAncestorHorizontalPadding(footer as HTMLElement);
  });
});
