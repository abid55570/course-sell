'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

/**
 * A product cover that parallaxes slightly (40px of travel) as it crosses the
 * viewport. The frame clips to the cover's aspect ratio; the image sits in an
 * oversized wrapper so the translate never reveals an edge.
 *
 * PERFORMANCE.
 *
 * This previously imported GSAP plus ScrollTrigger to move one image. Together
 * those are the largest lazy chunks on the site, downloaded on a product page
 * over Indian mobile data to produce 40px of drift, and ScrollTrigger installs
 * its own scroll machinery on top of the one already running for smooth scroll.
 *
 * The replacement is a scroll handler that reads layout only on mount and on
 * resize, then writes a single CSS custom property per frame. The transform is
 * composited, nothing reads layout during scroll, and no library is fetched.
 *
 * An IntersectionObserver gates the whole thing, so a cover that is not on
 * screen costs nothing at all.
 */
export default function ProductCoverParallax({
  src,
  alt,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const frameId = useRef(0);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let top = 0;
    let height = 0;
    let visible = false;

    function measure() {
      const rect = frame!.getBoundingClientRect();
      top = window.scrollY + rect.top;
      height = rect.height;
    }

    /** Write-only: -1 at the moment the frame enters, +1 as it leaves. */
    function paint() {
      const centre = top + height / 2;
      const viewportCentre = window.scrollY + window.innerHeight / 2;
      const reach = (window.innerHeight + height) / 2;
      const t = Math.max(-1, Math.min(1, (viewportCentre - centre) / reach));
      frame!.style.setProperty('--parallax', t.toFixed(4));
    }

    function onScroll() {
      if (!visible) return;
      cancelAnimationFrame(frameId.current);
      frameId.current = requestAnimationFrame(paint);
    }

    function onResize() {
      measure();
      paint();
    }

    // A cover off screen does nothing. On a page with several, this is the
    // difference between one active handler and all of them.
    //
    // Where IntersectionObserver is unavailable the gate is simply skipped
    // rather than the effect failing: a decorative parallax must never be able
    // to break a page that sells something.
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) {
            measure();
            paint();
          }
        },
        { rootMargin: '100px 0px' }
      );
      observer.observe(frame);
    } else {
      visible = true;
    }

    measure();
    paint();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(frameId.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      ref={frameRef}
      className="parallax-frame relative aspect-[3/4] w-full overflow-hidden bg-ink"
      style={{ '--parallax': 0 } as React.CSSProperties}
    >
      <div className="parallax-layer absolute inset-[-20px] sm:inset-[-24px]">
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" priority={priority} />
      </div>
    </div>
  );
}
