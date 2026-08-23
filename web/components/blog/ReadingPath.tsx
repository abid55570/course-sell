'use client';

import { useEffect, useRef } from 'react';

/**
 * A reading path down the side of an article.
 *
 * The line is a perforated ticket edge matching the tear rules used elsewhere,
 * and it fills as you read. Each section carries a stop; the one you are in
 * fills solid and names itself.
 *
 * PERFORMANCE, which is the whole design of this component.
 *
 * The first version drove the fill from React state and re-rendered on every
 * animation frame while scrolling, and it called getBoundingClientRect() in a
 * loop over every section on each of those frames. That is a layout read plus a
 * full reconcile per frame, and it was visibly janky.
 *
 * This version does none of that. Section offsets are measured ONCE (and again
 * on resize) into a plain array. During scroll nothing is read from layout and
 * no React state changes: progress is written straight to a CSS custom property
 * on a ref, and the active stop is toggled with a class. React renders this
 * component exactly once.
 */

export type PathSection = { id: string; heading: string };

export default function ReadingPath({ sections }: { sections: PathSection[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || sections.length === 0) return;

    const article = document.querySelector('article');
    if (!article) return;

    const stops = sections.map((s) => ({
      id: s.id,
      el: document.getElementById(s.id),
      dot: root.querySelector<HTMLElement>(`[data-dot="${s.id}"]`),
      link: root.querySelector<HTMLElement>(`[data-link="${s.id}"]`),
      top: 0,
    }));

    let start = 0;
    let span = 1;
    let lastActive = '';

    /** Reads layout. Called on mount and on resize only, never during scroll. */
    function measureLayout() {
      const rect = article!.getBoundingClientRect();
      start = window.scrollY + rect.top;
      span = Math.max(1, rect.height - window.innerHeight);
      for (const stop of stops) {
        if (stop.el) stop.top = window.scrollY + stop.el.getBoundingClientRect().top;
      }
    }

    /** Writes only. No layout reads, so this cannot thrash. */
    function paint() {
      const y = window.scrollY;
      const ratio = Math.min(1, Math.max(0, (y - start) / span));
      root!.style.setProperty('--read', String(ratio));

      const trigger = y + window.innerHeight * 0.28;
      let active = stops[0].id;
      for (const stop of stops) {
        if (stop.top <= trigger) active = stop.id;
      }
      // At the very bottom nothing further can pass the trigger line, so the
      // last section is what is being read wherever its heading happens to sit.
      if (window.innerHeight + y >= document.body.scrollHeight - 2) {
        active = stops[stops.length - 1].id;
      }

      if (active !== lastActive) {
        for (const stop of stops) {
          const on = stop.id === active;
          stop.dot?.classList.toggle('is-on', on);
          stop.link?.classList.toggle('is-on', on);
          if (on) stop.link?.setAttribute('aria-current', 'true');
          else stop.link?.removeAttribute('aria-current');
        }
        lastActive = active;
      }
    }

    function onScroll() {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(paint);
    }

    function onResize() {
      measureLayout();
      paint();
    }

    measureLayout();
    paint();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <div ref={rootRef} style={{ '--read': 0 } as React.CSSProperties}>
      {/* Mobile: a thin fill under the sticky header. The labelled list would
          crowd a 360px screen, so the phone gets position without the names. */}
      <div aria-hidden="true" className="reading-bar fixed inset-x-0 top-14 z-30 h-[3px] bg-ink/10 lg:hidden">
        <div className="reading-bar-fill h-full origin-left bg-primary" />
      </div>

      <nav
        aria-label="Sections in this post"
        className="sticky top-24 hidden max-h-[70vh] overflow-y-auto lg:block"
      >
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-soft">
          In this post
        </p>

        <div className="relative mt-4 pl-6">
          <span aria-hidden="true" className="reading-rail absolute bottom-1 left-[5px] top-1 w-[2px]" />
          <span
            aria-hidden="true"
            className="reading-rail-fill absolute left-[5px] top-1 h-[calc(100%-0.5rem)] w-[2px] origin-top bg-primary"
          />

          <ul className="space-y-4">
            {sections.map((section) => (
              <li key={section.id} className="relative">
                <span
                  aria-hidden="true"
                  data-dot={section.id}
                  className="reading-dot absolute -left-6 top-[7px] block h-3 w-3 border-2 border-ink/25 bg-canvas"
                />
                <a
                  href={`#${section.id}`}
                  data-link={section.id}
                  className="reading-link block text-sm leading-snug text-ink-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}
