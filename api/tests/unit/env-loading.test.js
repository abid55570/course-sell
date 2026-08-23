const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

// Regression test for the dotenv-resolves-against-cwd bug: server.js lives in
// api/, but .env lives at the repo root one level up. A bare
// `require('dotenv').config()` resolves `.env` relative to
// process.cwd(), not to the file doing the requiring -- so it silently loads
// nothing whenever the process is launched with a working directory other
// than the repo root (e.g. `cd api && node server.js`, which is exactly how
// the root package.json's `dev:api` script and any normal deploy invoke it).
//
// This spawns a real child process with its cwd pointed at a directory that
// has no .env at all (the OS temp dir), requires server.js from there, and
// asserts the env actually populated. A bare `dotenv.config()` would leave
// DATABASE_URL/JWT_SECRET undefined in that child and this test would fail.
test('server.js loads the repo-root .env regardless of the process working directory', () => {
  const serverPath = path.join(__dirname, '..', '..', 'server.js');
  const cwd = os.tmpdir();

  const script = `
    const app = require(${JSON.stringify(serverPath)});
    process.stdout.write(JSON.stringify({
      hasDbUrl: typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.length > 0,
      hasJwtSecret: typeof process.env.JWT_SECRET === 'string' && process.env.JWT_SECRET.length > 0,
    }));
  `;

  const result = spawnSync(process.execPath, ['-e', script], {
    cwd,
    encoding: 'utf8',
    timeout: 15000,
  });

  assert.equal(
    result.status,
    0,
    `child process exited with status ${result.status}\nstderr: ${result.stderr}`
  );

  const output = JSON.parse(result.stdout.trim());
  assert.equal(
    output.hasDbUrl,
    true,
    'DATABASE_URL was not loaded when server.js was required from a cwd other than api/ -- ' +
      'dotenv is probably resolving .env relative to process.cwd() again instead of __dirname'
  );
  assert.equal(
    output.hasJwtSecret,
    true,
    'JWT_SECRET was not loaded when server.js was required from a cwd other than api/'
  );
});
