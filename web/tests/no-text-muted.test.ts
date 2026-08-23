import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(tsx|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

// shadcn's `text-muted-foreground` legitimately lives inside components/ui —
// that namespace is shadcn's own and is left alone. Everything Dropdesk
// wrote itself (app pages, landing/product/bundle/legal components) must
// never bind to it, because shadcn's `muted` renders near-white on white.
describe('no rendered Dropdesk output contains text-muted', () => {
  const roots = ['app', 'components/landing', 'components/product', 'components/bundle', 'components/legal'];

  for (const root of roots) {
    const dir = path.resolve(__dirname, '..', root);
    let files: string[];
    try {
      files = walk(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      const rel = path.relative(path.resolve(__dirname, '..'), file);
      it(`${rel} never uses text-muted`, () => {
        const src = readFileSync(file, 'utf8');
        expect(src).not.toContain('text-muted');
      });
    }
  }
});
