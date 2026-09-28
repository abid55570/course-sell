#!/usr/bin/env bash
# Deploy Dropdesk. The web build fetches the catalog from the API, so the API
# has to be up-to-date before the web is built.
set -euo pipefail
cd "$(dirname "$0")"

API_PORT="${API_PORT:-4002}"
export WEB_PORT="${WEB_PORT:-3004}"

git fetch origin
git reset --hard origin/main

( cd api && npm ci --omit=dev )
( cd web && npm ci --include=dev )

npm run migrate
npm run migrate:catalog

# Reel bundles ship a Drive folder link, not attached files. migrate-catalog
# does not set that link (it lives in a separate map — see
# web/lib/catalog/products/reel-bundles.ts's reelBundleDriveFolderIds), so
# without this step every reel-bundle order fails email delivery with
# "Product needs an enabled HTTPS Google Drive link" (api/services/
# email-delivery.js). Idempotent, safe to re-run.
node api/scripts/set-reel-bundle-drive-links.js

# Unstick any past orders that failed with the drive-link reason (their
# product had no drive_link at the time). Now that drive_link is populated,
# reset them to 'pending' so the worker retries them once the API restarts.
# Read DATABASE_URL from the project .env (root, same file api reads).
if [ -z "${DATABASE_URL:-}" ] && [ -f .env ]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '\r' | sed -e 's/^["'\'']//' -e 's/["'\'']$//')"
fi
if [ -n "${DATABASE_URL:-}" ]; then
  psql "$DATABASE_URL" -c "UPDATE order_email_deliveries \
     SET status='pending', attempts=0, next_attempt_at=NOW(), \
         last_error=NULL, locked_until=NULL, updated_at=NOW() \
   WHERE status='failed' \
     AND last_error='Product needs an enabled HTTPS Google Drive link';" \
    || echo "warn: could not reset stuck deliveries (non-fatal, worker still runs)"
fi

pm2 restart dropdesk-api --update-env 2>/dev/null || pm2 start ecosystem.config.js --only dropdesk-api
sleep 2

status=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${API_PORT}/api/catalog/storefront")
if [ "$status" != "200" ]; then
  echo "API not ready (/api/catalog/storefront -> $status). Aborting before build."
  exit 1
fi

( cd web && npm run build )

pm2 restart dropdesk-web --update-env 2>/dev/null || pm2 start ecosystem.config.js --only dropdesk-web
pm2 save

# The email-delivery worker polls every 30s, so any orders stuck from a
# prior deploy (drive_link was NULL, delivery threw "needs an enabled HTTPS
# Google Drive link") will retry on the next tick once this deploy has
# populated the links above.
