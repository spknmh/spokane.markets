# Spokane Markets — Admin Setup & Operations Guide

A practical guide for getting the website running and understanding how markets, venues, events, and vendors fit together.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Markets vs Venues](#markets-vs-venues)
3. [Core Concepts & Relationships](#core-concepts--relationships)
4. [Initial Setup](#initial-setup)
5. [Admin Workflows](#admin-workflows)
6. [Configuration Reference](#configuration-reference)

---

## Quick Start

1. **Database**: PostgreSQL running (Docker: `npm run db:up`)
2. **Environment**: Copy `.env.example` → `.env.local`, fill required vars
3. **Migrations**: `npx prisma migrate deploy`
4. **Seed**: `npx prisma db seed` (creates admin user, tags, features, sample venues/markets/events)
5. **Run**: `npm run dev` → http://localhost:3000
6. **Admin**: Sign in as `admin@spokane.markets` / `admin123` → go to `/admin`

---

## Markets vs Venues

| | **Venue** | **Market** |
|---|---|---|
| **What it is** | A physical location (address, coordinates) | A recurring market or event brand |
| **Purpose** | Where things happen | What happens (identity, brand, schedule) |
| **Examples** | Riverfront Park, Convention Center, South Perry District | Spokane Saturday Market, South Perry Farmers Market |
| **Has its own page?** | No — venues are not browsable | Yes — `/markets/[slug]` |
| **Can be claimed?** | No | Yes — users can claim ownership |
| **Requires venue?** | — | Yes — every market has a primary location |
| **Fields** | Name, address, city, state, zip, lat/lng, neighborhood, parking notes | Name, slug, **venue** (required), description, image, social links, typical schedule, contact info |

**In plain terms:**

- **Venue** = *the place* (e.g. "Riverfront Park at 507 N Howard St")
- **Market** = *the recurring event or brand* (e.g. "Spokane Saturday Market" that runs Saturdays May–October) — **with a required primary venue**

Every market has a venue (location) attached. The market profile page shows that location. Events linked to a market can override the venue when the market moves (e.g. summer at Riverfront, winter at Convention Center).

---

## Core Concepts & Relationships

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Venue     │     │   Market    │     │   Vendor    │
│ (location)  │     │  (brand)    │     │ (business)  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  venueId          │  venueId          │  vendorProfileId
       │  (required)       │  (required)       │
       ▲                   │                   │
       │                   │  marketId         │
       │                   │  (optional)       │
       │                   ▼                   ▼
       │            ┌─────────────────────────────────┐
       └────────────│            Event                 │
                    │  venue, market, dates, tags      │
                    └─────────────────────────────────┘
                              ▲
                              │  VendorEvent (many-to-many)
                              │  "Vendor X will be at Event Y"
```

### Event

- **Required**: `venue` — every event happens somewhere
- **Optional**: `market` — if the event is part of a known recurring market
- **Optional**: `tags` (Farmers Market, Craft Fair, etc.), `features` (Indoor, Dog-Friendly, etc.)

### Vendor

- Vendors have profiles (`/vendors/[slug]`)
- Vendors **link themselves to events** via "Where We'll Be Next" (VendorEvent)
- A vendor can be linked to many events; an event can have many vendors

### Typical flow

1. **Create venues** first (Admin → Venues) — physical locations
2. **Create markets** (Admin → Markets) — recurring market brands, each with a required venue
3. **Create events** (Admin → Events) — pick a venue (required), optionally a market (venue defaults from market), add dates/tags/features
4. **Vendors** link to events from their dashboard (`/vendor/events/link`)

---

## Initial Setup

### 1. Environment variables

Copy `.env.example` to `.env.local` and set:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `AUTH_URL` | Yes | `http://localhost:3000` (dev) or your domain (prod) |
| `NEXT_PUBLIC_APP_URL` | Yes | Same as AUTH_URL — used for landing page, redirects |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Yes (Docker) | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional | OAuth sign-in |
| `AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET` | Optional | OAuth sign-in |
| `RESEND_API_KEY` | Optional | Email (newsletter, digest, alerts) |

### 2. Database

```bash
# Start PostgreSQL (Docker)
npm run db:up

# Run migrations
npx prisma migrate deploy

# Seed (admin user, tags, features, sample data)
npx prisma db seed
```

### 3. Uploads directory

For image uploads (banners, avatars, vendor images, photos):

```bash
mkdir -p uploads/banner uploads/avatar uploads/vendor uploads/photos
```

Docker/production: ensure the web process can write to `uploads/`.

### 4. First admin user

Seed creates `admin@spokane.markets` / `admin123`. **Change the password** after first login (or create a new admin via Admin → Users).

---

## Admin Workflows

### Creating an event

1. Go to **Admin → Events → New Event**
2. **Venue** (required): Choose where it happens. If the venue doesn’t exist, create it under Admin → Venues first.
3. **Market** (optional): If this event is part of a recurring market (e.g. Spokane Saturday Market), select it.
4. Fill title, dates, description, tags, features.
5. Set status: DRAFT → PENDING → PUBLISHED (only PUBLISHED events appear on the public site).

### Creating a market

1. **Admin → Markets → New Market**
2. Name, slug (URL-friendly, e.g. `spokane-saturday-market`), **venue** (required — primary location).
3. Description, image, social links.
4. `typicalSchedule` — e.g. "Saturdays, May–October".
5. `baseArea` — neighborhood for filtering (downtown, south-hill, etc.).
6. Markets can be **verified** and **claimed** by organizers. The market profile shows its venue (address, directions).

### Creating a venue

1. **Admin → Venues → New Venue**
2. Name, full address, lat/lng (for maps), neighborhood, parking notes.
3. Venues are shared — create once, reuse for many events.

### Content (banners)

1. **Admin → Content**
2. Upload images or paste external URLs for each page banner (hero, markets, vendors, events, etc.).
3. File uploads go to `/uploads/banner/`; external URLs work for any domain.

### Submissions & claims

- **Submissions** (Admin → Submissions): Public event submissions. Approve to create an event (or reject with notes).
- **Claims** (Admin → Claims): Market claims and vendor profile claims. Approve to assign ownership.

### Moderation queues

- **Reviews** (Admin → Reviews): Approve or reject user reviews.
- **Photos** (Admin → Photos): Approve or reject uploaded photos.
- **Reports** (Admin → Reports): User-reported content.

---

## Configuration Reference

### Landing page

Admin → Content → Landing Page. When enabled, visitors see a configurable "Coming Soon" or "Down for Maintenance" page instead of the main site. Admins can always access `/admin`.

Requires `NEXT_PUBLIC_APP_URL` in `.env.local`.

### User roles

| Role | Access |
|------|--------|
| USER | Browse, submit events, reviews, attendance, saved filters |
| VENDOR | + Vendor profile, link to events |
| ORGANIZER | + Create/edit events (own) |
| ADMIN | Full admin dashboard |

### Neighborhoods

Used for filtering events and markets. Defined in `src/lib/constants.ts` (NEIGHBORHOODS). Venues and markets use `baseArea` / `neighborhood` slugs (e.g. `downtown`, `south-hill`).

### Tags & features

Seeded in `prisma/seed.ts`. Tags: Farmers Market, Craft Fair, Art Fair, etc. Features: Indoor, Outdoor, Dog-Friendly, etc. Add more via direct DB or extend the seed.

---

## Summary

| Concept | One-liner |
|---------|-----------|
| **Venue** | Physical location — where events happen |
| **Market** | Recurring market brand — has its own page, can be claimed |
| **Event** | Specific occurrence — requires venue, optional market, dates/tags/features |
| **Vendor** | Business profile — links to events they’ll attend |

**Order of operations**: Venues first, then Markets (with venue), then Events. Vendors link to events from their dashboard.
