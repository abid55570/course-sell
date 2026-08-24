'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * The site's mobile navigation.
 *
 * Categories arrive as props from the server. This component must never import
 * the catalog: 84 products of data in a client bundle would spend the whole
 * first-load budget on its own.
 *
 * The focus trap is written by hand rather than pulled from a library. A
 * focus-trap dependency costs more gzipped than the entire drawer, and the
 * trap itself is a loop over one selector.
 */

export type DrawerCategory = {
  slug: string;
  label: string;
  hex: string;
  count: number;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

const LEGAL = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/refunds', label: 'Refunds' },
  { href: '/contact', label: 'Contact' },
];

export default function MobileDrawer({ categories }: { categories: DrawerCategory[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Route change closes the drawer. Without this a category link leaves the
  // panel sitting open over the page it just navigated to.
  //
  // Adjusted while rendering rather than in an effect: an effect paints the
  // open drawer over the new page for one frame before closing it, and React
  // flags the synchronous setState it needs. This is the documented way to
  // reset state when a value changes — React re-runs the component before
  // committing, and `setOpen(false)` on an already-closed drawer bails out.
  const [routeAtLastRender, setRouteAtLastRender] = useState(pathname);
  if (pathname !== routeAtLastRender) {
    setRouteAtLastRender(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    // Move focus into the panel so the next Tab lands inside it.
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Open menu"
        className="flex h-11 w-11 items-center justify-center border border-ink/15 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:hidden"
      >
        <span aria-hidden="true" className="flex flex-col gap-[5px]">
          <span className="block h-[2px] w-5 bg-ink" />
          <span className="block h-[2px] w-5 bg-ink" />
          <span className="block h-[2px] w-5 bg-ink" />
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/50"
          />

          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="drawer-panel absolute inset-y-0 left-0 flex w-[86%] max-w-[20rem] flex-col overflow-y-auto bg-canvas"
          >
            <div className="flex items-center justify-between border-b border-ink/15 px-5 py-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="Close menu"
              >
                <span aria-hidden="true" className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <nav className="flex-1 px-5 py-4" aria-label="Categories">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft">
                Browse
              </p>
              <ul className="mt-2 divide-y divide-ink/10">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/category/${category.slug}`}
                      className="flex min-h-[44px] items-center gap-3 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0"
                        style={{ backgroundColor: category.hex }}
                      />
                      <span className="flex-1 font-display text-lg font-bold uppercase leading-tight text-ink">
                        {category.label}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-ink-soft">
                        {String(category.count).padStart(2, '0')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <ul className="mt-6 divide-y divide-ink/10 border-t border-ink/15">
                <li>
                  <Link
                    href="/products"
                    className="flex min-h-[44px] items-center font-display text-lg font-bold uppercase text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    All products
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products#bundles"
                    className="flex min-h-[44px] items-center font-display text-lg font-bold uppercase text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Bundles
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="flex min-h-[44px] items-center font-display text-lg font-bold uppercase text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Blog
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="border-t border-ink/15 px-5 py-4">
              <ul className="flex flex-wrap gap-x-5 gap-y-1">
                {LEGAL.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
