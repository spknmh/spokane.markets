# Maintenance Mode Design

## Overview

A global site-state gate that can be switched on/off without redeploy, with RBAC-aware bypass. Replaces and extends the previous "landing page" toggle with three distinct modes.

## Modes

| Mode | Who can access | Who sees maintenance page |
|------|----------------|---------------------------|
| `OFF` | Everyone | No one |
| `MAINTENANCE_ADMIN_ONLY` | Admins only | Everyone else (including vendors, organizers, anonymous) |
| `MAINTENANCE_PRIVILEGED` | Admins + Vendors + Organizers | Regular users + anonymous |

## Storage & Cache

- **Primary**: `SiteState` table (single row) in PostgreSQL
- **Cache**: In-memory with 10s TTL via API response `Cache-Control`
- **Fallback**: On DB unavailability, fail **OPEN** (allow through) to avoid locking admins out. Public users see maintenance if last cached state was a maintenance mode; otherwise pass through.

## Route Allowlist (always bypass maintenance gate)

- `/api/auth/*` — NextAuth handlers (sign-in, callback, sign-out)
- `/api/auth/register` — User registration
- `/auth/*` — Auth pages (sign-in, sign-up, verify)
- `/api/site-config/maintenance` — Maintenance config API (used by middleware)
- `/api/health` — Health check
- `/maintenance` — Maintenance page itself (no loop: privileged users redirect out)
- `/admin` and `/admin/*` — Admin UI (admins reach via allowlist when privileged)
- `/_next/*` — Next.js static assets
- `/favicon.ico`, `/robots.txt`, `/sitemap.xml`
- Static files (matched by extension, e.g. `.*\.(ico|png|jpg|...)`)

## Loop Prevention

1. **Allowlist first**: Paths in the allowlist never hit the maintenance gate logic.
2. **`/maintenance`**: Always allowed. If a privileged user lands here, redirect to `?next=` or `/`.
3. **No redirect to `/maintenance` from `/maintenance`**: The maintenance page route is in the allowlist; we never rewrite to `/maintenance` when the user is already there.
4. **Auth flows**: `/api/auth/*` and `/auth/*` are allowlisted so sign-in works during maintenance.

## RBAC Enforcement

- **Source**: `session.user.role` from JWT (stored in token at sign-in).
- **Middleware**: Uses `getToken` from `next-auth/jwt` (Edge-compatible, no DB).
- **Helper**: `isPrivilegedForMaintenance(role, mode)`:
  - `OFF` → everyone privileged
  - `MAINTENANCE_ADMIN_ONLY` → only `ADMIN`
  - `MAINTENANCE_PRIVILEGED` → `ADMIN`, `VENDOR`, `ORGANIZER`

## Migration from Landing Toggle

- The previous `landing_enabled` / `landing_header` / `landing_text` in `SiteConfig` is superseded by `SiteState`.
- If `landing_enabled` was `true`, migration sets `mode = MAINTENANCE_ADMIN_ONLY` and copies header/text to `messageTitle`/`messageBody`.
- Admin UI at `/admin/content` is updated to use the new maintenance mode form.
