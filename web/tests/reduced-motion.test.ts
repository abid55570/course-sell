import { describe, it, expect, vi } from 'vitest';
import { prefersReducedMotion } from '@/lib/motion/reduced-motion';

function mockMatchMedia(reduced: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: reduced && q.includes('reduce'),
    media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
}

describe('prefersReducedMotion', () => {
  it('is true when the user asked for reduced motion', () => {
    mockMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
  });

  it('is false otherwise', () => {
    mockMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });
});

// The old module also exported a `useReveal` hook that nothing called, but
// whose dynamic import('gsap') kept GSAP and ScrollTrigger in the build graph.
// Roughly 43KB gzipped of chunks were emitted for a hook with zero call sites.
describe('motion modules pull no animation library', () => {
  it('keeps GSAP out of the source graph entirely', async () => {
    const { readFileSync, readdirSync } = await import('node:fs');
    const path = (await import('node:path')).default;

    const roots = ['../components', '../lib', '../app'];
    const offenders: string[] = [];

    function walk(dir: string) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name)) {
          // Strip comments first: this very suite documents the removal in
          // prose that mentions the import, and a naive scan matches its own
          // explanation.
          const src = readFileSync(full, 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, '');
          if (/from ['"]gsap|import\(['"]gsap/.test(src)) offenders.push(full);
        }
      }
    }
    for (const root of roots) walk(path.resolve(__dirname, root));

    expect(
      offenders,
      `these still import GSAP, which costs ~43KB gz for effects CSS does natively: ${offenders.join(', ')}`
    ).toEqual([]);
  });
});
