# Production Deployment Guide

Step-by-step runbook for deploying Spokane Markets with Docker, Caddy, and GitHub Actions.

## Read This First

This guide is written for one production server and one domain.

- Recommended domain/host: `spokane.markets`
- Deploy path on server: `/opt/spokane.markets`
- Deploy user on server: `deploy`

### Command execution contexts

Every command in this guide is tagged with where to run it:

- **[LOCAL]** your laptop/workstation
- **[SERVER-ROOT]** server shell as `root` (or a sudo-capable admin user)
- **[SERVER-DEPLOY]** server shell as `deploy`
- **[GITHUB-UI]** GitHub website settings pages

If you run a command in the wrong place, deployment will fail.

## Architecture Summary

- App image: `ghcr.io/redkeysh/spokane.markets:latest`
- Init image: `ghcr.io/redkeysh/spokane.markets:init`
- CI flow: push to `main` -> lint/test -> build/push images -> SSH into server -> compose pull/up
- Runtime: `init` runs migrations and upload-dir prep, then exits; `web` starts after init succeeds

## 1) Choose and lock hostnames

Pick one SSH host value and use it consistently.

Recommended:

- `SERVER_HOST=spokane.markets`

You can use an internal hostname or IP instead, but then `SERVER_HOST_KEY` must match that exact value.

## 2) Server bootstrap

### 2.1 Install Docker

**Run on [SERVER-ROOT]:**

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Log out/in once so your group membership refreshes.

### 2.2 Create deploy user and directories

**Run on [SERVER-ROOT]:**

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
sudo mkdir -p /opt/spokane.markets
sudo chown -R deploy:deploy /opt/spokane.markets
docker network create webapp || true
```

`--disabled-password` is expected and recommended. This user authenticates by SSH key only.

### 2.3 Clone repo

**Run on [SERVER-DEPLOY]:**

```bash
git clone https://github.com/redkeysh/spokane.markets.git /opt/spokane.markets
cd /opt/spokane.markets
```

## 3) SSH keys for GitHub Actions deploy

### 3.1 Generate CI deploy key

**Run on [LOCAL]:**

```bash
ssh-keygen -t ed25519 -a 64 -f ~/.ssh/spokane_actions -C "github-actions@spokane.markets"
```

This creates:

- private key: `~/.ssh/spokane_actions` -> goes to `SERVER_SSH_KEY` secret
- public key: `~/.ssh/spokane_actions.pub` -> installed into `/home/deploy/.ssh/authorized_keys`

### 3.2 Install public key on server (passwordless deploy user safe flow)

Because `deploy` has disabled password, do not rely on `ssh-copy-id deploy@...` unless `deploy` already has key access.

**Run on [SERVER-ROOT]:**

```bash
sudo tee -a /home/deploy/.ssh/authorized_keys >/dev/null
```

Paste the full contents of `~/.ssh/spokane_actions.pub`, press Enter, then Ctrl+D.  
Then run:

```bash
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

### 3.3 Verify deploy user key login

**Run on [LOCAL]:**

```bash
ssh -i ~/.ssh/spokane_actions deploy@spokane.markets "echo ok"
```

If this fails, do not continue to GitHub secrets yet.

## 4) Host key pinning (SERVER_HOST_KEY)

This verifies the server identity during CI SSH.

### 4.1 Collect host key

**Run on [LOCAL]** from a trusted network:

```bash
ssh-keyscan -H spokane.markets
```

Copy the **single `ssh-ed25519` line** (not the `# ...` comment lines).

### 4.2 What secret values should be

If your workflow target is `spokane.markets`, then:

- `SERVER_HOST=spokane.markets`
- `SERVER_HOST_KEY=<ssh-keyscan -H spokane.markets ed25519 line>`

They must refer to the same host.

## 5) Server runtime `.env.local`

**Run on [SERVER-DEPLOY]:**

```bash
cd /opt/spokane.markets
cp .env.example .env.local
nano .env.local
```

Required runtime values:

| Variable | Example |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:YOUR_PASSWORD@db:5432/spokane_markets?schema=public` |
| `POSTGRES_PASSWORD` | strong password |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://spokane.markets` |
| `NEXT_PUBLIC_APP_URL` | `https://spokane.markets` |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | `openssl rand -base64 32` |

Important:

- `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` should match.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` must match the GitHub secret value used for CI builds.

## 6) Caddy and firewall

### 6.1 Caddyfile

**Run on [SERVER-DEPLOY]:**

- Set your email in `Caddyfile`.
- Ensure site domain blocks match your production domain.

### 6.2 Firewall

**Run on [SERVER-ROOT]:**

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw allow 22/tcp
sudo ufw enable
```

If SSH uses non-22, allow that port instead.

## 7) GitHub secrets

### 7.1 Create GHCR token

**Run on [GITHUB-UI]:**

Create a PAT (fine-grained or classic) with package read access.

- required: `read:packages`
- for private repos: also repo read access

### 7.2 Set Actions secrets

**Run on [GITHUB-UI]** in repo secrets (and environment `spokane.market` if used):

| Secret | Value |
|---|---|
| `SERVER_HOST` | `spokane.markets` |
| `SERVER_USER` | `deploy` |
| `SERVER_PORT` | `22` (optional; default is 22) |
| `SERVER_DEPLOY_PATH` | `/opt/spokane.markets` (optional; this is default) |
| `SERVER_SSH_KEY` | contents of `~/.ssh/spokane_actions` (private key) |
| `SERVER_HOST_KEY` | pinned `ssh-ed25519` host key line from `ssh-keyscan -H spokane.markets` |
| `GHCR_USERNAME` | GitHub account/org that can read package |
| `GHCR_TOKEN` | PAT from step 7.1 |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | same value as server `.env.local` |
| `NEXT_PUBLIC_APP_URL` | `https://spokane.markets` |

Optional build-time secrets:

- `NEXT_PUBLIC_GTM_ID`
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
- `NEXT_PUBLIC_UMAMI_SCRIPT_URL`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

## 8) First deployment

### Option A (recommended): GitHub Actions

**Run on [LOCAL]:**

```bash
git push origin main
```

Workflow does:

1. lint/test
2. build and push `latest` and `init` images
3. SSH to server and run:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans
docker image prune -f
```

### Option B: manual server deploy

**Run on [SERVER-DEPLOY]:**

```bash
cd /opt/spokane.markets
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans
```

## 9) Post-deploy checks

**Run on [SERVER-DEPLOY]:**

```bash
cd /opt/spokane.markets
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 init
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 web
```

Verify in browser:

- app loads on `https://spokane.markets`
- admin can sign in
- upload URLs serve from `/uploads/...`

Admin guide: [ADMIN-GUIDE.md](ADMIN-GUIDE.md)

## 10) Seed and cron operations

### Seed (manual)

Seed does not run automatically during deploy.

**Run on [SERVER-DEPLOY]:**

```bash
cd /opt/spokane.markets
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm init npx prisma db seed
```

### Cron jobs in production

The `cron` service runs:

- weekly digest (Mon 09:00): `scripts/weekly-digest.ts`
- filter alerts (daily 08:00): `scripts/filter-alerts.ts`
- DB backup (daily 02:00): `scripts/pg-backup.sh`

## 11) Troubleshooting

### Site down (emergency triage)

**Run on [SERVER-DEPLOY]:**

```bash
cd /opt/spokane.markets
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps -a
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs init --tail=120
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs web --tail=200
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs caddy --tail=80
```

Interpret quickly:

- **`init` exited non-zero** — migrations failed; `web` never starts → fix DB / migration error, then `docker compose ... up -d` again.
- **`web` restarting or exited** — read `logs web` for Node errors, OOM, or missing env (e.g. `DATABASE_URL`).
- **`web` running but unhealthy** — often **Next bound only to the container hostname**, not `127.0.0.1`, because Docker sets `HOSTNAME`. The compose file sets `HOSTNAME=0.0.0.0` for `web` so `localhost:3000` works for healthchecks and Caddy. After fixing, `docker compose ... exec web wget -qO- http://127.0.0.1:3000/api/health/live` should return JSON.
- **Caddy 502** — usually `web` not listening; confirm `web` is `Up` and port 3000 responds inside the container as above.

**Fast restart (after fixing the underlying error):**

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans
```

| Issue | Check |
|---|---|
| 502/Bad gateway | `docker compose ... ps` and `docker compose ... logs web` |
| Migrations fail | `docker compose ... logs init`, DB readiness (`pg_isready`) |
| Upload 404 | volume mounts for `uploads_data` in `web` + `caddy` |
| Upload EACCES | init container ownership/chmod step |
| Auth redirects wrong | `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` mismatch |
| SSH deploy fails | host/key mismatch (`SERVER_HOST` vs `SERVER_HOST_KEY`), key permissions, docker access |
| GHCR pull denied | `GHCR_USERNAME`/`GHCR_TOKEN` permissions (`read:packages`) |

### Failed to find Server Action

Usually client/server build mismatch.

1. Keep `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` identical in server `.env.local` and GitHub secret.
2. Rebuild/redeploy after key changes.
3. Hard refresh browser cache.
