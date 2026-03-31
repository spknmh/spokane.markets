# Caddy (isolated edge)

This directory holds a **separate** Docker Compose project for Caddy so the reverse proxy keeps running when the main app stack (`docker-compose.yml`) is restarted or redeployed.

- **Config:** repo-root `Caddyfile` (mounted `../Caddyfile`).
- **Network:** external `webapp` — the app **`web`** service must attach to this network so Caddy can `reverse_proxy web:3000` (see root `docker-compose.yml`).

**Production**

On a **brand-new** host (no prior `spokanemarkets` Caddy volumes), create TLS volumes once:

```bash
docker volume create spokanemarkets_caddy_data
docker volume create spokanemarkets_caddy_config
```

Then:

```bash
cd /opt/spokane.markets   # or your clone path
docker compose -f caddy/docker-compose.yml -f caddy/docker-compose.prod.yml up -d
```

**Local (ports 8080 / 8443)**

```bash
docker compose -f caddy/docker-compose.yml up -d
```

**Environment**

- `UPLOADS_VOLUME_NAME` — if the app uploads volume is not named `spokanemarkets_uploads_data`, set it in `caddy/.env` (see `docker volume ls`).

**Migrating** from an older layout where Caddy lived inside the app compose file: [docs/MIGRATION-CADDY.md](../docs/MIGRATION-CADDY.md).

See also [docs/DEPLOY.md](../docs/DEPLOY.md) § 6.2.
