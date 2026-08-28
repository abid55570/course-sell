# Deployment (PM2 + Nginx)

Production deployment of **Dropdesk** on a Linux VPS (Ubuntu/Debian assumed)
using **PM2** as the process manager and **Nginx** as a reverse proxy with HTTPS.

Dropdesk is a **monorepo with two long-running processes**:

| Process | Path | Default port | Serves |
|---|---|---|---|
| `dropdesk-api` | `api/` | **4000** (`PORT` in `.env`) | `/api/*`, the `/admin` panel, `/m/:id` short links, `/uploads` |
| `dropdesk-web` | `web/` | **3000** (`next start`) | the storefront — `/`, `/products`, `/checkout`, `/order`, `/blog`, … |

> **The one rule that matters:** the storefront reads its catalogue from
> `GET /api/catalog/storefront` **at build time**. The API must be up, running
> the current code, and have the catalog loaded **before** you build `web/`.
> Getting this order wrong is the single most common deploy failure — see
> [§5](#5-the-deploy-order-that-matters) and [§11](#11-health--troubleshooting).

No system ffmpeg is required — `ffmpeg-static` bundles the binary. You need
Node.js 18+ (20 LTS recommended) and a PostgreSQL database (managed or self-hosted).

---

## 1. Server prerequisites

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# PM2 (global)
sudo npm install -g pm2

# (optional) Nginx + certbot for HTTPS
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

> Rendering is CPU-bound. A 2+ vCPU box is recommended. Keep `RENDER_CONCURRENCY`
> at 1–2 on small servers.

---

## 2. Get the code + install dependencies

```bash
sudo mkdir -p /var/www && sudo chown $USER /var/www
cd /var/www
git clone <your-repo-url> dropdesk
cd dropdesk
mkdir -p logs                        # PM2 log dir (see ecosystem.config.js)

# API — production deps only
( cd api && npm ci --omit=dev )

# WEB — FULL deps: `next build` needs the devDeps (typescript, tailwind), and
# `npm run migrate:catalog` runs web/scripts/export-catalog.js which
# `require('typescript')` from web/node_modules. Do NOT --omit=dev here.
( cd web && npm ci --include=dev )
```

---

## 3. Configure environment

There are **two** env surfaces — the API reads the repo-root `.env`, the Next
web app reads its own `web/.env.production`.

**A) `.env` (API)** — copy the example and edit:

```bash
cp .env.example .env
nano .env
```

Set for production:

```env
NODE_ENV=production
PORT=4000                 # the API port; the web app owns 3000
SITE_NAME=Dropdesk
SITE_URL=https://yourdomain.com

DATABASE_URL=postgresql://user:pass@db-host:5432/dbname   # single primary
JWT_SECRET=<64+ random chars>                             # node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# Razorpay (leave blank to keep checkout paused until you go live)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=                                  # set after §8

# Email (blank SMTP = emails are logged, not sent)
SMTP_USER=you@gmail.com
SMTP_PASS=<gmail app password>
SUPPORT_EMAIL=you@gmail.com

RENDER_CONCURRENCY=1
# Object storage (Swift) + video pricing: see .env.example for the full list.
```

**B) `web/.env.production` (Next web app)** — create it. `NEXT_PUBLIC_*` values
are **inlined at build time**, so this file must exist *before* `npm run build`:

```env
API_BASE=http://127.0.0.1:4000            # server-side + build-time fetches (same host)
NEXT_PUBLIC_API_BASE=https://yourdomain.com   # browser calls the API by absolute URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

---

## 4. Prepare the database

Run from the repo root (these proxy into `api/`):

```bash
npm run migrate          # schema migrations (creates catalog tables 010–012)
npm run migrate:catalog  # load the storefront catalog into catalog_products
                         # (idempotent upsert by slug; needs web deps installed)
npm --prefix api run init-admin   # create admin from ADMIN_EMAIL / ADMIN_PASSWORD
```

> `seed:catalog` is **superseded** — it now refuses to run. Use `migrate:catalog`.

Optional pre-flight — refuses (non-zero exit) if the store isn't safe to take
money (placeholder legal pages, unverifiable checkout, undeliverable products):

```bash
npm run check:ready
```

---

## 5. The deploy order that matters

Because the storefront build fetches the catalog from the API, always deploy in
this order — **API first, verify, then build the web**:

```bash
# 1. API up-to-date and running the CURRENT code
( cd api && npm ci --omit=dev )
npm run migrate
npm run migrate:catalog
pm2 restart dropdesk-api        # (first deploy: started in §6 instead)

# 2. GATE — the storefront route must answer 200 with real JSON before building
curl -s -o /dev/null -w "storefront: %{http_code}\n" http://127.0.0.1:4000/api/catalog/storefront
curl -s http://127.0.0.1:4000/api/catalog/storefront | head -c 200; echo

# 3. Only if the gate is 200 + populated: build the web, then reload it
( cd web && npm ci --include=dev && npm run build )
pm2 restart dropdesk-web
```

A **404** from the gate means the API is running stale code (the
`/api/catalog/storefront` route isn't mounted, so the request falls through to
the `/:slug` catch-all). A **200 but empty** means the catalog wasn't loaded —
re-run `npm run migrate:catalog`.

---

## 6. Start with PM2

A ready `ecosystem.config.js` (both processes) is included.

```bash
pm2 start ecosystem.config.js
# If port 3000 is already taken on the host, move the web app:
#   WEB_PORT=3004 pm2 start ecosystem.config.js
pm2 save                 # persist the process list
pm2 startup              # run the command it prints so PM2 restarts on boot
```

Useful:

```bash
pm2 status
pm2 logs dropdesk-api
pm2 logs dropdesk-web
pm2 restart dropdesk-api     # after any api/ change
pm2 restart dropdesk-web     # after a web build
```

The API listens on `127.0.0.1:4000`, the web app on `127.0.0.1:3000` (or `WEB_PORT`).

---

## 7. Nginx reverse proxy

One `server` block, routing the API-owned prefixes to the Express process and
everything else to Next. `/etc/nginx/sites-available/dropdesk`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 75M;              # buyer photo uploads

    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;               # video renders/downloads

    # Express API + legacy admin (port 4000)
    location /api/     { proxy_pass http://127.0.0.1:4000; }
    location /admin    { proxy_pass http://127.0.0.1:4000; }
    location /m/       { proxy_pass http://127.0.0.1:4000; }
    location /uploads/ { proxy_pass http://127.0.0.1:4000; }
    location /js/      { proxy_pass http://127.0.0.1:4000; }   # legacy admin assets
    location /css/     { proxy_pass http://127.0.0.1:4000; }

    # Next.js storefront (port 3000, or WEB_PORT)
    location /         { proxy_pass http://127.0.0.1:3000; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/dropdesk /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com --redirect
```

> **Behind Cloudflare?** `certbot --nginx` (HTTP-01) can't validate while the
> record is proxied (orange cloud). Temporarily set the DNS record to **DNS
> only** (grey cloud) so it resolves to the origin, issue the cert, then
> re-enable the proxy with SSL/TLS mode **Full (strict)**. Match the web port in
> the `location /` block to `WEB_PORT` if you changed it.

---

## 8. Razorpay webhook

In the Razorpay Dashboard → **Settings → Webhooks**:

- URL: `https://yourdomain.com/api/payments/webhook`
- Events: `payment.captured`, `order.paid`
- Copy the signing secret into `RAZORPAY_WEBHOOK_SECRET` in `.env`, then
  `pm2 restart dropdesk-api`.

The webhook is the reliable confirmation path (fires even if the buyer closes
the tab). The browser checkout signature is also verified — both funnel through
the same idempotent fulfilment. Leaving `RAZORPAY_*` blank keeps checkout paused
(in production the server refuses to fulfil an order it can't verify).

---

## 9. Persistent storage + backups

- Buyer photos and rendered videos go to object storage (Swift) when the
  `SWIFT_*` vars are set, otherwise to `api/storage/` on local disk (outside the
  public web root; served only through payment-gated endpoints). Keep local
  storage on a persistent disk and schedule cleanup of old files.
- Back up PostgreSQL regularly (`pg_dump`). Catalog, courses, orders and
  template data all live in the DB.

---

## 10. Updating (redeploy)

Follow the order in [§5](#5-the-deploy-order-that-matters). In full, on a box
that tracks `main`:

```bash
cd /var/www/dropdesk
git fetch origin && git reset --hard origin/main   # .env / web/.env.production are gitignored → kept
( cd api && npm ci --omit=dev )
( cd web && npm ci --include=dev )
npm run migrate
npm run migrate:catalog
pm2 restart dropdesk-api
# verify the gate (see §5) is 200 + populated, THEN:
( cd web && npm run build )
pm2 restart dropdesk-web
pm2 save
```

---

## 11. Health & troubleshooting

- **Health check:** `curl -s localhost:4000/api/site-info` returns JSON.
- **`catalog fetch failed: 404` during `next build`:** the API is down or
  running stale code. Restart `dropdesk-api` onto the current code and confirm
  `curl localhost:4000/api/catalog/storefront` is `200` before rebuilding — see §5.
- **Storefront builds but is empty:** the catalog wasn't loaded —
  `npm run migrate:catalog`.
- **Logs:** `pm2 logs dropdesk-api` / `pm2 logs dropdesk-web` (or `logs/*.log`).
- **Payments not completing:** verify `RAZORPAY_*` keys and that the webhook URL
  is reachable over HTTPS; check `pm2 logs dropdesk-api` for signature errors.
- **DB errors / empty data:** confirm `DATABASE_URL` points at a single primary,
  not a replica load balancer.
