import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const css = readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8');

describe('design tokens', () => {
  const expected: Record<string, string> = {
    '--color-canvas': '#FFFFFF',
    '--color-canvas-2': '#F6F8FC',
    '--color-ink': '#0B1020',
    '--color-ink-soft': '#5A6480',
    '--color-urgent': '#8F5500',
    '--color-proof': '#12B981',
  };

  for (const [token, value] of Object.entries(expected)) {
    it(`defines ${token} as ${value}`, () => {
      expect(css).toContain(`${token}: ${value}`);
    });
  }

  it('declares the four font families', () => {
    for (const f of ['--font-display', '--font-body', '--font-mono', '--font-deva']) {
      expect(css).toContain(f);
    }
  });

  // shadcn's variable layer must survive, or every shadcn/KokonutUI
  // component loses its colours.
  it('keeps shadcn base-nova variables intact', () => {
    for (const v of ['--background', '--foreground', '--primary-foreground', '--border', '--radius']) {
      expect(css).toContain(v);
    }
    expect(css).toContain('@theme inline');
  });

  it('remaps shadcn primary to the Dropdesk brand vermilion', () => {
    expect(css).toContain('--primary: #C42B22');
  });

  // shadcn's own `@theme inline` legitimately maps `--color-muted: var(--muted)`
  // and button.tsx uses `bg-muted`. What must never happen is Dropdesk binding
  // its body-text colour to that namespace, which would put near-white text on
  // a near-white background.
  it('never binds the Dropdesk body-text colour to shadcn\'s muted namespace', () => {
    expect(css).not.toContain('--color-muted: #5A6480');
    expect(css).toContain('--color-ink-soft: #5A6480');
  });
});
