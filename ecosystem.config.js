// PM2 process config for DropDash.
//
// Single fork instance on purpose: the render queue runs in-process, so running
// multiple clustered instances would spawn duplicate queues and double-process
// jobs. To render more videos in parallel, raise RENDER_CONCURRENCY in .env
// (bounded by CPU) rather than adding instances.
//
// Env is loaded from .env by the app itself (dotenv). Start with:
//   pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'dropdash',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '700M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      time: true,
    },
  ],
};
