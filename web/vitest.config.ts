import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,

    // Stubs lib/catalog/loader so the catalog accessors answer from the
    // TypeScript product files instead of the API. Without it every suite that
    // renders a page would need a running API and a seeded database. See the
    // file's own comment for why the seam sits there.
    setupFiles: ['./tests/setup/catalog-fixture.ts'],

    // Several suites failed intermittently in full runs while passing in
    // isolation. The cause was not shared state, as first assumed: the error is
    // "Test timed out in 5000ms". Some of these tests render the whole homepage
    // or browse page, and the catalog is now 84 products. Rendering that in
    // jsdom while other workers compete for the machine simply takes longer
    // than the 5s default.
    //
    // The tests are not wrong and the renders are not accidental, so the budget
    // is raised rather than the tests trimmed. If one ever exceeds this, that is
    // a genuine signal worth reading rather than a number to raise again.
    testTimeout: 30_000,
    hookTimeout: 30_000,

    // Kept regardless: a suite whose result depends on file order is not a
    // suite anyone can trust, and these are cheap insurance against that.
    unstubGlobals: true,
    unstubEnvs: true,
    restoreMocks: true,
    clearMocks: true,
  },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
});
