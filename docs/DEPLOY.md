# Production Deployment Guide

Deploy Spokane Markets using Docker, Caddy, and GitHub Actions.

## Overview

- **Stack**: Next.js (standalone), PostgreSQL, Caddy
- **CI/CD**: Push to `main` → build images → push to GHCR → SSH deploy
- **Images**: `ghcr.io/redkeysh/spokane.markets:latest` (web), `ghcr.io/redkeysh/spokane.markets:init` (migrate + seed)
- **Runtime**: Node.js 25 (inside container); host Node version is irrelevant
- **Deploy flow**: `init` runs `prisma migrate deploy` and `prisma db seed` on startup, then exits; `web` starts after `init` completes

## Prerequisites

- Linux server with Docker and Docker Compose v2
- Domain pointed at the server (e.g. `spokane.markets`)
- GitHub repo with Actions enabled

## 1. Server Setup

### Install Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in
```

### Clone the repo

```bash
cd ~
git clone https://github.com/redkeysh/spokane.markets.git
cd spokane.markets
```

### Create uploads directory

```bash
mkdir -p uploads/banner uploads/avatar uploads/vendor uploads/photos
chmod -R 777 uploads
```

The init container also creates these subdirs on first run. If you see `EACCES` on upload, ensure the web process can write to `uploads/`.

### Create `.env.local`

Copy from `.env.example` and fill in production values:

```bash
cp .env.example .env.local
nano .env.local
```

Required production values:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `postgresql://postgres:YOUR_PASSWORD@db:5432/spokane_markets?schema=public` |
| `POSTGRES_PASSWORD` | Strong password for PostgreSQL |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://spokane.markets` (your domain) |
| `NEXT_PUBLIC_APP_URL` | `https://spokane.markets` |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | `openssl rand -base64 32` — **required** for Server Actions in Docker. Must also be set as GitHub Secret for CI builds. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional. From Google Cloud Console |
| `AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET` | Optional. From Meta Developer |
| `RESEND_API_KEY` | From Resend dashboard |

## 2. Caddyfile (Domain)

Edit `Caddyfile`:
1. Replace `you@yourdomain.com` with your email (for Let's Encrypt notifications).
2. Ensure the site block domain matches your domain (e.g. `spokane.markets`).

Caddy obtains TLS certificates automatically. HTTP/2 and HTTP/3 are enabled by default (requires ports 80, 443/tcp, 443/udp).

## 3. GitHub Secrets

In **Settings → Secrets and variables → Actions**, add:

| Secret | Description |
|--------|-------------|
| `SERVER_HOST` | Server hostname or IP |
| `SERVER_USER` | SSH username (e.g. `deploy` or `root`) |
| `SERVER_SSH_KEY` | Private SSH key (full contents, including `-----BEGIN ...-----`) |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Same value as in `.env.local` — `openssl rand -base64 32`. Required for Server Actions. |
| `NEXT_PUBLIC_APP_URL` | Same as `AUTH_URL` (e.g. `https://spokane.markets`). Required for client bundle. |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager container ID (e.g. `GTM-MCG6KBNR`). Optional; consent banner shows regardless. |

Ensure the server allows SSH key auth for `SERVER_USER`.

## 4. First-Time Deployment

### Option A: Via GitHub Actions (recommended)

1. Push to `main`. The workflow builds both images (web & init), pushes to GHCR, and deploys.
2. If the server has no image yet, the first run may fail on `docker pull`. Run once manually:

```bash
ssh user@server
cd ~/spokane.markets
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Migrations and seed run automatically in the `init` container before `web` starts.

### Option B: Manual deploy

```bash
# On your machine: build and push both images
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="your-base64-key"
export NEXT_PUBLIC_APP_URL="https://spokane.markets"
export NEXT_PUBLIC_GTM_ID="GTM-MCG6KBNR"  # optional
docker build -t ghcr.io/redkeysh/spokane.markets:latest --target runner \
  --build-arg NEXT_PUBLIC_APP_URL \
  --build-arg NEXT_PUBLIC_GTM_ID \
  --secret id=NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,env=NEXT_SERVER_ACTIONS_ENCRYPTION_KEY .
docker build -t ghcr.io/redkeysh/spokane.markets:init --target init \
  --build-arg NEXT_PUBLIC_APP_URL \
  --build-arg NEXT_PUBLIC_GTM_ID \
  --secret id=NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,env=NEXT_SERVER_ACTIONS_ENCRYPTION_KEY .
docker push ghcr.io/redkeysh/spokane.markets:latest
docker push ghcr.io/redkeysh/spokane.markets:init

# On server
cd ~/spokane.markets
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 5. Post-Deploy

### Seed database

Seed runs automatically in the `init` container on every deploy. To re-run seed manually:

```bash
docker compose run --rm init npx prisma db seed
```

### Verify

- https://your-domain → app loads
- https://your-domain/admin → admin login works
- Uploads: create a review with a photo, confirm `/uploads/photos/...` serves

**Admin operations:** See [docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md) for markets vs venues, events, vendors, and workflows.

### Analytics (Umami) verification

When Umami is enabled (`NEXT_PUBLIC_UMAMI_WEBSITE_ID` set at build), run this checklist after deploy:

| Check | How to verify |
|-------|----------------|
| Script load | DevTools → Network: request to script URL (e.g. `https://analytics.spokane.markets/script.js`) returns **200** |
| `window.umami` | DevTools → Console: `window.umami` is an object, `typeof window.umami.track === "function"` |
| Route change pageview | Navigate to another route (e.g. `/` → `/events`); Network shows a POST to the Umami collect endpoint (e.g. `/api/send`) |
| Custom event | Trigger an action (e.g. accept consent, newsletter subscribe); Network shows POST to same collect endpoint |
| No double pageview | Umami dashboard: initial load shows one pageview for the landing page |
| Adblock | If the script is blocked by an adblocker, tracking will not run; document as expected. |

Debug page: visit `/debug/analytics` to inspect Umami script state, `trackReady`, and `data-domains` vs current hostname.

## 6. Image Reference

`docker-compose.prod.yml` uses:
- `ghcr.io/redkeysh/spokane.markets:latest` (web)
- `ghcr.io/redkeysh/spokane.markets:init` (init)

If your repo is under a different org/user, update the `image` keys to match `ghcr.io/OWNER/REPO` (same as `github.repository`).

## 7. Firewall

Open ports 80 (HTTP), 443/tcp (HTTPS, HTTP/2), and 443/udp (HTTP/3):

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw allow 22
sudo ufw enable
```

## 8. Cron Jobs (Digest & Filter Alerts)

The `cron` service runs:
- **Weekly digest** (Mondays 9:00): `scripts/weekly-digest.ts` — emails subscribers with upcoming events
- **Filter alerts** (daily 8:00): `scripts/filter-alerts.ts` — emails users with saved filters when new events match

The cron service uses the same image as `init` and shares `.env.local`. Ensure `RESEND_API_KEY` is set for email delivery.

**Alternative: host crontab** (if Docker cron is unreliable):

```bash
# Add to crontab -e
0 9 * * 1 cd /path/to/spokane.markets && docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm web npm run digest
0 8 * * * cd /path/to/spokane.markets && docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm web npm run filter-alerts
```

Note: The web image is standalone and may not include tsx. Use the init image instead:

```bash
0 9 * * 1 cd /path/to/spokane.markets && docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm init npm run digest
0 8 * * * cd /path/to/spokane.markets && docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm init npm run filter-alerts
```

## 9. Troubleshooting

| Issue | Check |
|-------|-------|
| 502 Bad Gateway | `docker compose ps` — is `web` running? `docker compose logs web` |
| Migrations fail | `DATABASE_URL` correct? DB healthy? `docker compose logs init` for migrate output; `docker compose exec db pg_isready -U postgres` |
| Uploads 404 | `uploads/` exists? Caddy volume `./uploads:/srv/uploads:ro` |
| Auth redirect wrong | `AUTH_URL` and `NEXT_PUBLIC_APP_URL` must match your domain |
| SSH deploy fails | `SERVER_SSH_KEY` includes full key; server allows key auth |
| **TLS cert error** (`remote error: tls: internal error`) | Caddyfile uses `disable_tlsalpn_challenge` to force HTTP-01. Ensure ports 80 and 443 are open (`ufw status`), DNS points to server IP, and no proxy/load balancer terminates TLS before Caddy. If behind Cloudflare or similar, use DNS-01 challenge instead. |
| **Build `npm ci` ECONNRESET** | Transient network failure. Retry the build. The Dockerfile sets `fetch-retries`, `fetch-retry-mintimeout`, and `fetch-retry-maxtimeout` to harden against this. If it persists: `docker build --network host -t ... .` or check proxy/firewall. |
| **Cron not running** | Check `docker compose logs cron`. Ensure init image has crond (Alpine). If missing, use host crontab (see §8). |
| **Failed to find Server Action** | Set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (generate: `openssl rand -base64 32`) in: (1) `.env.local` on server, (2) GitHub Secrets for CI builds. Rebuild images so the key is embedded at build time. For local `docker compose build`, ensure the key is in `.env` (Compose loads it) or exported. Clear browser cache after deploy. |
