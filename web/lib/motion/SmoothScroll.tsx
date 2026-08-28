'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { prefersReducedMotion } from './reduced-motion';

type LenisInstance = {
  raf: (t: number) => void;
  destroy: () => void;
  scrollTo: (target: number, opts?: { immediate?: boolean }) => void;
};

/**
 * Smooth scrolling, tuned to feel immediate rather than floaty.
 *
 * The previous configuration was `duration: 1.1`, which glides for over a
 * second after every wheel tick or flick. That does not read as smooth, it
 * reads as lag: the page keeps travelling after you have stopped, and the
 * content you aimed at slides past. It was the single biggest contributor to
 * the site feeling sluggish.
 *
 * Three changes:
 *
 * 1. `lerp` instead of `duration`. Lerp follows the pointer frame by frame and
 *    settles fast; duration commits to a fixed easing envelope regardless of
 *    what the finger is doing. 0.12 stays responsive while removing the step
 *    quantisation of a raw wheel event.
 *
 * 2. Touch is left NATIVE. A phone's own scrolling is hardware-accelerated and
 *    already excellent, and intercepting it costs a frame of latency on exactly
 *    the devices least able to spare one. Nearly all of this store's traffic is
 *    mid-range Android, so smoothing touch would make the common case worse.
 *
 * 3. The rAF loop stops when the tab is hidden, so a backgrounded tab is not
 *    burning frames.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisInstance | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;

    // A coarse pointer means a touchscreen, where native scrolling wins.
    if (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) return;

    let frame = 0;
    let cancelled = false;

    const loop = (time: number) => {
      lenisRef.current?.raf(time);
      frame = requestAnimationFrame(loop);
    };

    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
      } else if (lenisRef.current) {
        frame = requestAnimationFrame(loop);
      }
    }

    (async () => {
      const Lenis = (await import('lenis')).default;
      if (cancelled) return;
      lenisRef.current = new Lenis({
        lerp: 0.12,
        wheelMultiplier: 1,
        smoothWheel: true,
        syncTouch: false,
      }) as unknown as LenisInstance;
      frame = requestAnimationFrame(loop);
      document.addEventListener('visibilitychange', onVisibility);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibility);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Reset to the top on client-side navigation. Lenis keeps its own target
  // scroll position and re-applies it every frame, which overrides the App
  // Router's scroll-to-top — so a product opened from a scrolled listing would
  // otherwise open at that same offset, often down at the footer. Sync Lenis to
  // 0 (or the native scroll when Lenis is disabled: reduced-motion / touch).
  useEffect(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname]);

  return <>{children}</>;
}
