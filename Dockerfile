FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache wget tini && \
    addgroup -S app && adduser -S app -G app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p public/uploads/pdfs public/uploads/thumbnails && \
    chown -R app:app /app

USER app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/site-info >/dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "node scripts/migrate.js && node scripts/init-admin.js && node server.js"]
