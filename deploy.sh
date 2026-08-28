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
