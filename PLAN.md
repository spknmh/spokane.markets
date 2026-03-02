# Spokane.Markets — Development Plan

**Spokane.Markets** is a production-grade web application serving as the default **index + calendar + discovery layer** for Spokane-area markets, fairs, and vendor events. The goal: a Spokane-realistic UX that beats Facebook for clarity, filtering, and trust signals.

## Hard Deployment Constraints

- **NO Vercel**. Deploy to a **dedicated server in Oregon**.
- Use **Docker** for everything.
- Provide a **docker-compose.yml** that includes:
  - `web` (Next.js)
  - `db` (Postgres container)
  - `caddy` (reverse proxy + automatic HTTPS)
  - optional `adminer` or `pgadmin` (dev only profile)
- Use `DATABASE_URL` pointing to the Postgres container.
- The app must support:
  - local dev via `docker compose up`
  - production via `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
- Include **database migrations** (Prisma migrate) running safely in production.

---

## Non-goals (hard constraints)

- **No ticketing**. Do not process payments or handle ticket issuance/check-in.
- Do not attempt "full Facebook replacement." Spokane will still use FB; this app will *index and normalize* better than FB.
- Avoid overbuilding social features (no endless feed). This is a utility product first.

---

## Product Context (Spokane Reality)

Spokane-area events are fragmented across:
- Facebook events/groups (primary)
- Instagram posts/stories
- Flyers/posters
- Word-of-mouth
- Small organizer websites (often outdated)

Users decide based on:
- "What's happening **this weekend**?"
- "Is it worth it?" (vendor quality, vibe, parking, weather contingency)
- "Which vendors will be there?"

Vendors complain about:
- Not knowing **when/where** shows are until late
- **Incomplete event info** (fees, load-in, power, rules, hours)
- **Unreliable quality** (poor marketing, low foot traffic, over-saturated categories)
- Operational surprises (parking/load-in, cell service, indoor/outdoor, weather)
- Difficulty building a pipeline (deadlines, waitlists, different apps per event)

---

## Core Value Proposition

This app stands out by providing **three things Facebook does poorly**:

1) **Normalization**
   - One clean canonical event record (date/time/location/links/tags)
   - Deduplication and consistent fields
   - Clear recurring market structure (Market -> Event Instances)

2) **Decision-grade filters**
   - Date range: Today / This weekend / Next 7 days / This month
   - Neighborhood/Area: predefined Spokane-area presets (Downtown, South Hill, Valley, etc.)
   - Categories + Features: farmers market, craft fair, art fair, street fair, food festival, holiday market, etc.
   - Vendor-friendly features: indoor/outdoor, power, food trucks, beer/wine/cider, kid-friendly, dog-friendly, ADA-friendly, parking notes

3) **Trust signals**
   - "Verified organizer/market" (claim + verification)
   - Community reviews for events/markets (structured + moderation)
   - "Reliability notes" for recurring markets (communication quality, marketing strength, weather plan)
   - Simple "Going/Interested" counts (low friction, builds momentum)

---

## Target Audiences & Roles (RBAC)

### Public Visitor (anonymous)
- Browse events/markets
- Search + filter
- View event detail pages
- Subscribe to digest (email)

### Consumer Account (USER)
- "Going / Interested"
- Leave reviews and upload photos (with moderation)
- Save markets and filters (basic)

### Vendor Account (VENDOR)
- Create a vendor profile (Phase 2, keep lightweight in MVP)
- Optional: claim vendor identity for their profile page
- "Where we'll be next" (auto-generated from events they're listed on)
- Vendor can submit events or corrections, but cannot publish without approval unless verified partner.

### Market/Organizer Manager (ORGANIZER)
- Claim a Market profile (verification flow)
- Submit / manage their event instances (draft -> review -> publish)
- Add structured logistics fields (load-in, power, rules, booth fee, deadlines)
- Optional: attach vendor lineup (Phase 2)

### Admin/Moderator (ADMIN)
- Approve events/submissions
- Merge duplicates
- Moderate reviews/photos
- Manage tags/areas
- Verify organizer claims
- Manage "featured" placements (for later monetization)

**Verification is critical**. It is the differentiator and reduces spam.

---

## MVP Scope (deploy fast, iterate live)

### MVP Must-Haves

1) **Event Index**
   - List view + map view (map shows pins only, no routing)
   - Filters: date range, neighborhood/area, category, features
   - Sort: soonest, most saved/going

2) **Event Details Page**
   - Title, date/time, venue + address
   - "Get Directions" link (opens venue address in user's preferred maps app via Google Maps / Apple Maps URL)
   - Tags/features
   - Organizer/market association if applicable
   - External links (official site + Facebook event link)
   - "Going/Interested"
   - Reviews & photos (moderated)

3) **Market Profiles**
   - Market "brand" page
   - Upcoming event instances
   - Basic info: typical schedule, neighborhoods served, contact links
   - "Claim this market" workflow

4) **Submission Workflow**
   - Public "Submit an event" form (FB link field supported)
   - Submissions are **pending** by default
   - Admin queue to approve/edit/publish

5) **Admin Dashboard**
   - Event CRUD
   - Submission queue (approve/deny)
   - Duplicate merge tooling (minimal heuristic)
   - Moderation queue for reviews/photos
   - Market claim requests

6) **Email capture**
   - Newsletter signup (store as subscriber table)
   - Weekly digest generation script, sent via **Resend** API

### MVP Must NOT include
- Ticketing, checkout, payouts
- Complex vendor booking/applications
- Full messaging/chat
- Drive-time / distance-based filtering or routing

---

## Differentiators (implement at least 2 in MVP)

1) **Neighborhood-first UX**
   - Default: "This weekend" with optional area filter
   - Uses familiar Spokane neighborhood presets, not abstract radii
   - Directions deferred to user's preferred maps app ("Get Directions" link)

2) **Event completeness score**
   - Show simple "info completeness" indicator (e.g., 6/10 fields filled).
   - Prompts organizers to add missing logistics; helps vendors trust listings.

3) **Organizer verification badge**
   - Claim + verify (manual admin approval initially; later email domain proof).
   - Verified organizers can publish without manual approval after trust is established.

4) **Structured review prompts**
   - For events/markets ask: parking, vendor variety, price/value, crowding, weather plan, accessibility, marketing strength.

---

## Tech Stack (Mar 2026, Docker-friendly)

- **Next.js (App Router) + TypeScript**
- **Postgres** (official `postgres:16` image) in Docker
- ORM: **Prisma**
- Auth: **Auth.js (NextAuth v5)** with Prisma adapter + database sessions
  - Providers: Credentials (email + password, bcrypt), Google OAuth, Facebook OAuth
- UI: **Tailwind + shadcn/ui**
- Forms: **React Hook Form + Zod**
- Search: Postgres full-text + trigram
- Maps: **Leaflet + OpenStreetMap** (free, no API key) for optional map pin view
- Email: **Resend** for transactional emails (verification, password reset) and weekly digest
- Rate limiting: middleware + DB-backed counters (Redis optional later)
- Reverse proxy: **Caddy** container (automatic HTTPS via built-in ACME / Let's Encrypt)
- CI/CD: **GitHub Actions** (build image, push to GHCR, deploy via SSH to Oregon server)

Security/practicality:
- All privileged routes enforce RBAC server-side.
- All write operations require auth except public submission (rate-limited; optional captcha later).
- Admin routes protected; do not rely on client-only checks.

---

## Data Model (Prisma; design for recurring markets)

Implement:
- **User** (role: USER/VENDOR/ORGANIZER/ADMIN, hashedPassword for credentials auth)
- **Account** (Auth.js Prisma adapter: OAuth provider links per user)
- **Session** (Auth.js Prisma adapter: database-backed sessions)
- **VerificationToken** (Auth.js Prisma adapter: email verification tokens)
- **Venue** (name, address, lat, lng, neighborhood/area, parking_notes)
- **Market** (name, description, links, base_area, verification_status, owner_user_id optional)
- **Event** (market_id optional, venue_id required, title, description, start/end, recurrence_group_id optional, tags/features, external_links, status)
- **Tag / Feature** (enum + join table)
- **Attendance** (user_id, event_id, status: GOING/INTERESTED)
- **Review** (user_id, event_id or market_id, rating, text, structured fields, status)
- **Photo** (review_id, url, status)
- **Submission** (raw user-submitted data, status, reviewer admin_id)
- **ClaimRequest** (market_id, user_id, proof, status)
- **Subscriber** (email, area preferences, created_at)

Modeling note:
- Event is the *instance* (one date/time).
- Market is the *brand/series*.
- Account, Session, VerificationToken follow the Auth.js Prisma adapter schema.

---

## UI/UX Requirements (clean, local, fast)

- Mobile-first, fast list browsing.
- Default landing shows:
  - "This weekend"
  - Neighborhood/area filter chips
  - Category chips
- Provide list view (primary) + map view (secondary, pins only)
- Event cards show: date badge, neighborhood/area tag, key feature tags
- "Get Directions" link on event detail pages opens venue in user's maps app
- Avoid clutter. This is a utility.

Neighborhood/area presets:
- Downtown / Riverfront / Kendall Yards
- South Hill / Perry District
- Garland / North Monroe
- North Spokane / Mead
- Spokane Valley / Millwood
- Liberty Lake
- Cheney / Airway Heights
- Optional later: CDA / Post Falls

---

## Admin Dashboard Requirements

- Left nav: Events, Markets, Venues, Submissions, Reviews/Photos, Claims, Subscribers
- Submissions queue:
  - quick approve/edit/publish
  - venue suggestion
  - tag assignment
  - duplicate suggestions
- Moderation:
  - hide/unhide reviews
  - approve/deny photos
- Claims:
  - approve organizer verification
  - after verified: allow organizer publishing

---

## Docker + Database Requirements

### Deliver these files
- `Dockerfile` (multi-stage) for Next.js production build
- `docker-compose.yml` (dev)
- `docker-compose.prod.yml` (prod overrides)
- `Caddyfile` (reverse proxy to Next.js, serves uploaded files, automatic HTTPS)
- `.env.example` (all required env vars)
- `scripts/` with:
  - `migrate.sh` (runs prisma migrate deploy)
  - `seed.sh` (runs prisma db seed)
  - `healthcheck.sh` (optional)

### Postgres container requirements
- Use named volume for persistence
- Include `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- App `DATABASE_URL` format:
  - `postgresql://USER:PASSWORD@db:5432/DB?schema=public`

### Photo / upload storage
- Docker named volume mapped to host path (e.g., `./uploads:/app/uploads`)
- Caddy serves `/uploads` as static files directly via `file_server` directive
- No external object storage required for MVP

### Migration strategy (production-safe)
- On first deploy: run `prisma migrate deploy` from the web container (or a one-off `migrate` service)
- Never run `prisma migrate dev` in production
- Ensure app waits for DB readiness (healthcheck + depends_on conditions)

### Caddy requirements
- Reverse proxy to Next.js container on internal network
- Serve `/uploads` path as static files from the uploads volume via `file_server`
- Automatic HTTPS via Caddy's built-in ACME client (Let's Encrypt) — no certbot or manual cert management needed
- For local dev, use `localhost` (Caddy auto-generates a local CA cert)
- For production, set the domain in `Caddyfile` and Caddy handles TLS automatically

---

## CI/CD Pipeline (GitHub Actions)

### Workflow: `.github/workflows/deploy.yml`
- **Trigger**: push to `main` branch
- **Steps**:
  1. Checkout code
  2. Build Docker image (multi-stage Next.js production build)
  3. Push image to GitHub Container Registry (GHCR)
  4. SSH into Oregon server
  5. Pull latest image from GHCR
  6. Run `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
  7. Run `prisma migrate deploy` via the web container

### Required GitHub Secrets
- `SERVER_HOST` (Oregon server IP/hostname)
- `SERVER_USER` (SSH user)
- `SERVER_SSH_KEY` (private key for SSH access)
- `GHCR_TOKEN` (GitHub token for container registry, or use `GITHUB_TOKEN`)

---

## Vendor Survey Module (public page; store responses)

Add a "Vendor Survey" page to validate pain points:
- vendor type
- lead time needed
- biggest pain points
- missing info when evaluating shows
- willingness to pay for vendor tools
- optional contact for interview

Store results in DB for export.

---

## Build Plan (step-by-step)

### Milestone 1 (MVP deployable)
- Scaffold Next.js + Prisma + Docker
- Postgres container wired
- Auth.js with Credentials + Google + Facebook OAuth, database sessions via Prisma adapter
- Venue CRUD (admin)
- Market CRUD (admin)
- Event CRUD (admin)
- Public event browse (filters + list + map pins)
- Event detail page with "Get Directions" link
- Submission form + admin approval queue
- Seed script with sample Spokane data
- Docker production build + Caddy reverse proxy
- GitHub Actions CI/CD pipeline
- Deployment docs

### Milestone 2 (trust + retention)
- Going/Interested
- Reviews + photo uploads with moderation (stored in Docker named volume)
- Market claim workflow
- Newsletter signup + weekly digest generation via Resend

### Milestone 3 (vendor value)
- Vendor profiles (lightweight)
- Vendor "where we'll be next" pages
- Organizer self-service publishing after verification
- Saved filters + alerts (email via Resend)

---

## Output Requirements

1) Complete repo scaffold with:
   - Next.js app structure
   - Prisma schema + migrations
   - Seed script with sample Spokane data (realistic placeholders)
2) Full Docker setup:
   - Dockerfile + compose files + Caddyfile
   - Uploads volume for photo storage
   - "How to deploy on a dedicated server" steps (build, pull, run, migrate)
3) CI/CD pipeline:
   - `.github/workflows/deploy.yml`
4) RBAC implementation (server-enforced)
5) Admin UI pages + forms
6) Public UI pages + filtering logic
7) Submission + moderation workflows

---

## Seed Data (include realistic Spokane examples)

Seed:
- Venues: Riverfront area, South Perry area, Spokane Valley area, etc. (approx coords OK)
- Markets: a few example recurring markets (generic placeholders acceptable)
- Events: multiple weekend instances with varied tags (outdoor, food trucks, beer/wine)

The goal is functionality and flows, not perfect historical accuracy.

---

## Quality Bar

- Fast loading, clean UI, no janky admin experience.
- No broken auth. No public write endpoints without rate limits.
- SEO-ready pages with good metadata and OpenGraph.
- Built for rapid iteration; avoid gold-plating.

---

## Environment Variables (.env.example)

```
# Database
DATABASE_URL=postgresql://USER:PASSWORD@db:5432/spokane_markets?schema=public
POSTGRES_DB=spokane_markets
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changeme

# Auth.js
AUTH_SECRET=generate-a-random-secret
AUTH_URL=http://localhost:3000

# Google OAuth
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Facebook OAuth
AUTH_FACEBOOK_ID=
AUTH_FACEBOOK_SECRET=

# Resend (email)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
