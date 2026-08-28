// PM2 process config for Dropdesk — a monorepo with two long-running processes.
//
//   dropdesk-api : Express (api/server.js). Serves /api/*, the legacy /admin
//                  panel, /m short links and /uploads. The render queue runs
//                  in-process, so this is a single fork instance on purpose —
//                  clustering would spawn duplicate queues and double-process
//                  jobs. Scale rendering via RENDER_CONCURRENCY in .env, not
//                  instances. Reads its config (incl. PORT, default 4000) from
//                  the repo-root .env via dotenv.
//
//   dropdesk-web : Next.js storefront (web/). `next start`, owns port 3000 by
//                  default. Set WEB_PORT before `pm2 start` to move it (e.g.
//                  WEB_PORT=3004 when 3000 is already taken on the host). It
//                  reads API_BASE / NEXT_PUBLIC_* from web/.env.production.
//
// The storefront fetches its catalogue from the API AT BUILD TIME, so the API
// must be running the current code (and the catalog loaded — `npm run
// migrate:catalog`) BEFORE `npm run build` in web/. See deployment.md.
//
// Paths are resolved from this file's location so it works wherever the repo is
// checked out. Start from anywhere:  pm2 start ecosystem.config.js
const path = require('path');
const ROOT = __dirname;

module.exports = {
  apps: [
    {
      name: 'dropdesk-api',
      cwd: path.join(ROOT, 'api'),
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '700M',
      env: { NODE_ENV: 'production' }, // PORT comes from ../.env (default 4000)
      out_file: path.join(ROOT, 'logs', 'api-out.log'),
      error_file: path.join(ROOT, 'logs', 'api-err.log'),
      time: true,
    },
    {
      name: 'dropdesk-web',
      cwd: path.join(ROOT, 'web'),
      script: 'node_modules/next/dist/bin/next',
      args: `start${process.env.WEB_PORT ? ` -p ${process.env.WEB_PORT}` : ''}`,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '600M',
      env: { NODE_ENV: 'production' },
      out_file: path.join(ROOT, 'logs', 'web-out.log'),
      error_file: path.join(ROOT, 'logs', 'web-err.log'),
      time: true,
    },
  ],
};
