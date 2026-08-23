/**
 * Whether the visitor has asked for reduced motion.
 *
 * This module used to also export `useReveal`, a GSAP + ScrollTrigger scroll
 * reveal hook. Nothing ever called it, but its dynamic `import('gsap')` kept
 * both libraries in the build graph, so roughly 43KB gzipped of chunks were
 * emitted for a hook with zero call sites. The hook is gone; only the check
 * below was ever used.
 */
export function prefersReducedMotion(): boolean {
  if (typeof matchMedia !== 'function') return false;
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
