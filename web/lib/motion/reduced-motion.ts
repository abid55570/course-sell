import { useSyncExternalStore } from 'react';

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

function subscribe(onChange: () => void): () => void {
  if (typeof matchMedia !== 'function') return () => {};
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/**
 * The same check, as a value a component can read while rendering.
 *
 * A media query is an external store, so it is read through
 * `useSyncExternalStore` rather than copied into state from an effect. The
 * effect version cost a second render on every mount and tripped
 * `react-hooks/set-state-in-effect`. This version also tracks the setting if
 * the visitor changes it mid-session, which the effect version never did.
 *
 * The server snapshot is `false`: the server cannot know the preference, and
 * full motion is the safe markup to hydrate against.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
