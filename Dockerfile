# ── base ──────────────────────────────────────────────────────────────
FROM node:25-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
# Harden npm against transient network failures (ECONNRESET, timeouts)
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000
RUN npm ci

# ── builder ───────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY . .
RUN mkdir -p public
# prisma generate needs DATABASE_URL in config; placeholder suffices (no DB connection)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
RUN npm run build

# ── runner ────────────────────────────────────────────────────────────
# Minimal app image: Next.js standalone only. No prisma/node_modules.
# Migrate and seed run in the init container.
FROM node:25-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system nodejs && adduser --system --ingroup nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

# ── init ─────────────────────────────────────────────────────────────
# Runs migrate + seed on deploy. Uses full node_modules (no cherry-picking).
# Depends on init completing before web starts.
FROM builder AS init
WORKDIR /app
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]
