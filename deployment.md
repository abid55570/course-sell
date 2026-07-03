# Deployment (PM2 + Nginx)

Production deployment of **DropDash** on a Linux VPS (Ubuntu/Debian assumed) using **PM2** as the process manager and **Nginx** as a reverse proxy with HTTPS.

No system ffmpeg is required — `ffmpeg-static` bundles the binary. You do need Node.js 18+ and a PostgreSQL database (managed or self-hosted).

---

## 1. Server prerequisites

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# PM2 (global)
sudo npm install -g pm2

# (optional) Nginx + certbot for HTTPS
sudo apt-get install -y nginx
sudo apt-get install -y certbot python3-certbot-nginx
```

> Rendering is CPU-bound. A 2+ vCPU box is recommended. Keep `RENDER_CONCURRENCY` at 1–2 on small servers.

---

## 2. Get the code + install

```bash
sudo mkdir -p /var/www && sudo chown $USER /var/www
cd /var/www
git clone <your-repo-url> dropdash   # or upload the folder
cd dropdash
npm ci --omit=dev                    # production deps only
mkdir -p logs                        # PM2 log dir (see ecosystem.config.js)
```

---

## 3. Configure `.env`

```bash
cp .env.example .env
nano .env
```

Set for production:

```env
NODE_ENV=production
PORT=3000
SITE_NAME=DropDash
SITE_URL=https://yourdomain.com

DATABASE_URL=postgresql://user:pass@db-host:5432/dbname   # single primary

JWT_SECRET=<64+ random chars>

# Razorpay (live keys)
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx           # set after step 7

# Email
SMTP_USER=you@gmail.com
SMTP_PASS=<gmail app password>
SMTP_FROM_NAME=DropDash
SUPPORT_EMAIL=you@gmail.com

# Rendering + pricing
RENDER_CONCURRENCY=2
VIDEO_PRICE_LOW=699
VIDEO_PRICE_MID=999
VIDEO_PRICE_HIGH=1299
VIDEO_DISCOUNT_PERCENT=70
```

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

---

## 4. Prepare the database

```bash
npm run migrate         # apply migrations 001–005
npm run seed:video      # load templates + categories (+ tier prices)
npm run init-admin      # create admin from ADMIN_EMAIL / ADMIN_PASSWORD
```

---

## 5. Start with PM2

A ready `ecosystem.config.js` is included (single fork instance — the render queue is in-process; scale rendering via `RENDER_CONCURRENCY`, not instances).

```bash
pm2 start ecosystem.config.js
pm2 save                 # persist the process list
pm2 startup              # print a command to run so PM2 restarts on boot — run it
```

Useful:

```bash
pm2 status
pm2 logs dropdash
pm2 reload dropdash      # zero-downtime reload after a deploy
pm2 restart dropdash
pm2 monit
```

The app now listens on `127.0.0.1:3000`.

---

## 6. Nginx reverse proxy

`/etc/nginx/sites-available/dropdash`:

```nginx
server {
    server_name yourdomain.com;

    # Buyer photo uploads (up to 5 × ~12MB)
    client_max_body_size 75M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Video renders/downloads can take a bit
        proxy_read_timeout 300s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/dropdash /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com     # HTTPS (auto-renews)
```

---

## 7. Razorpay webhook

In the Razorpay Dashboard → **Settings → Webhooks**:

- URL: `https://yourdomain.com/api/payments/webhook`
- Events: `payment.captured`, `order.paid`
- Copy the signing secret into `RAZORPAY_WEBHOOK_SECRET` in `.env`, then `pm2 reload dropdash`.

The webhook is the reliable confirmation path (fires even if the buyer closes the tab after paying). The app also verifies the browser checkout signature — both funnel through the same idempotent fulfilment.

---

## 8. Persistent storage + backups

- Rendered videos and buyer photos are written to `storage/renders` and `storage/photos` (outside the public web root; served only through payment-gated endpoints). Keep these on a persistent disk.
- Old renders/photos accumulate — schedule cleanup (e.g. a cron deleting files older than N days) to control disk usage.
- Back up PostgreSQL regularly (`pg_dump`). Course thumbnails and template data live in the DB.

---

## 9. Updating (redeploy)

```bash
cd /var/www/dropdash
git pull
npm ci --omit=dev
npm run migrate          # apply any new migrations
npm run seed:video       # if templates/prices changed
pm2 reload dropdash      # zero-downtime
```

To change prices for an occasion, edit `VIDEO_PRICE_*` / `VIDEO_DISCOUNT_PERCENT` in `.env`, then `pm2 reload dropdash` (and `npm run seed:video` to refresh stored admin values).

---

## 10. Health & troubleshooting

- **Health check:** `curl -s localhost:3000/api/site-info` should return JSON.
- **Logs:** `pm2 logs dropdash` (or `logs/out.log`, `logs/error.log`).
- **Render stuck/failed:** check the admin **Video Templates → render queue**; a project can be re-rendered from there. Renders left mid-flight by a restart are auto-recovered on boot.
- **Payments not completing:** verify `RAZORPAY_*` keys and that the webhook URL is reachable over HTTPS; check `pm2 logs` for signature errors.
- **DB errors / empty data:** confirm `DATABASE_URL` points at a single primary, not a replica load balancer.
