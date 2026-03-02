# Production Deployment Guide

Deploy Spokane Markets using Docker, Caddy, and GitHub Actions.

## Overview

- **Stack**: Next.js (standalone), PostgreSQL, Caddy
- **CI/CD**: Push to `main` → build image → push to GHCR → SSH deploy
- **Image**: `ghcr.io/redkeysh/spokane.markets:latest`
- **Runtime**: Node.js 25 (inside container); host Node version is irrelevant

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
mkdir -p uploads
chmod 755 uploads
```

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

Ensure the server allows SSH key auth for `SERVER_USER`.

## 4. First-Time Deployment

### Option A: Via GitHub Actions (recommended)

1. Push to `main`. The workflow will build, push, and deploy.
2. If the server has no image yet, the first run may fail on `docker pull`. Run once manually:

```bash
ssh user@server
cd ~/spokane.markets
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose exec web npx prisma migrate deploy
```

### Option B: Manual deploy

```bash
# On your machine: build and push
docker build -t ghcr.io/redkeysh/spokane.markets:latest .
docker push ghcr.io/redkeysh/spokane.markets:latest

# On server
cd ~/spokane.markets
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose exec web npx prisma migrate deploy
```

## 5. Post-Deploy

### Seed database (optional)

```bash
docker compose exec web npx prisma db seed
```

If you get `prisma: not found`, rebuild the image (the Prisma CLI is copied into the production image).

### Verify

- https://your-domain → app loads
- https://your-domain/admin → admin login works
- Uploads: create a review with a photo, confirm `/uploads/photos/...` serves

## 6. Image Reference

`docker-compose.prod.yml` uses `ghcr.io/redkeysh/spokane.markets:latest`. If your repo is under a different org/user, update the `image` key to match `ghcr.io/OWNER/REPO:latest` (same as `github.repository`).

## 7. Firewall

Open ports 80 (HTTP), 443/tcp (HTTPS, HTTP/2), and 443/udp (HTTP/3):

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw allow 22
sudo ufw enable
```

## 8. Troubleshooting

| Issue | Check |
|-------|-------|
| 502 Bad Gateway | `docker compose ps` — is `web` running? `docker compose logs web` |
| Migrations fail | `DATABASE_URL` correct? DB healthy? `docker compose exec db pg_isready -U postgres` |
| Uploads 404 | `uploads/` exists? Caddy volume `./uploads:/srv/uploads:ro` |
| Auth redirect wrong | `AUTH_URL` and `NEXT_PUBLIC_APP_URL` must match your domain |
| SSH deploy fails | `SERVER_SSH_KEY` includes full key; server allows key auth |
| **TLS cert error** (`remote error: tls: internal error`) | Caddyfile uses `disable_tlsalpn_challenge` to force HTTP-01. Ensure ports 80 and 443 are open (`ufw status`), DNS points to server IP, and no proxy/load balancer terminates TLS before Caddy. If behind Cloudflare or similar, use DNS-01 challenge instead. |
| **Build `npm ci` ECONNRESET** | Transient network failure. Retry the build. The Dockerfile sets `fetch-retries`, `fetch-retry-mintimeout`, and `fetch-retry-maxtimeout` to harden against this. If it persists: `docker build --network host -t ... .` or check proxy/firewall. |
