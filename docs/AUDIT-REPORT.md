# Spokane.market — Audit & QA Report

**Date:** 2025-03-02  
**Scope:** Hyper-local markets platform (events, vendors, organizers, reviews, favorites, notifications)  
**Stack:** Next.js 16 (App Router), React 19, TypeScript, Prisma/Postgres, NextAuth v5 beta

---

## 1. Executive Summary (Top 10 Risks/Gaps)

1. **Open redirect vulnerability** — `callbackUrl` from sign-in/sign-up is passed to `router.push()` without validation; attackers can redirect users to malicious sites.
2. **Unsubscribe 404** — Weekly digest links to `/unsubscribe?email=...` but the route does not exist; users cannot unsubscribe (CAN-SPAM risk).
3. **No error boundaries or custom 404/500** — Unhandled errors and 404s fall through to default Next.js pages; no graceful degradation.
4. **Unbounded list queries** — Events and vendors pages load all matching rows; no pagination; risk of timeouts and poor UX at scale.
5. **Missing rate limiting** — Reviews, photo uploads, claims, vendor-survey, and auth endpoints have no rate limits; abuse/spam risk.
6. **No ToS/Privacy pages** — Required for trust and legal compliance; missing entirely.
7. **Cron not wired in deployment** — `weekly-digest.ts` and `filter-alerts.ts` must run manually; no cron in Docker or DEPLOY.md.
8. **Data integrity gaps** — No unique constraints on Review (one per user per event), ClaimRequest, VendorClaimRequest; duplicate claims/reviews possible.
9. **Photo moderation has no admin UI** — Schema supports `ModerationStatus` on Photo; only reviews have an admin queue; photos may never be approved.
10. **No health check endpoint** — No `/api/health` or `/health`; orchestration/load balancers cannot verify app readiness.

---

## 2. P0 / P1 / P2 Roadmap

### P0 — Launch Blockers / Security / Data Integrity

| ID | Item | Rationale |
|----|------|-----------|
| P0-1 | Fix open redirect on `callbackUrl` | Security: phishing/redirect attacks |
| P0-2 | Add `/unsubscribe` route + List-Unsubscribe header | CAN-SPAM compliance; digest links are broken |
| P0-3 | Add unique constraints: Review (userId+eventId/marketId), ClaimRequest (userId+marketId), VendorClaimRequest (userId+vendorProfileId) | Prevent duplicate claims/reviews |
| P0-4 | Add ToS and Privacy pages | Legal/trust baseline |
| P0-5 | Add rate limiting to reviews, uploads, claims, vendor-survey | Abuse prevention |

### P1 — Critical for Adoption / Retention

| ID | Item | Rationale |
|----|------|-----------|
| P1-1 | Pagination for events and vendors lists | Performance and UX at scale |
| P1-2 | Error boundaries + custom `not-found.tsx` and `global-error.tsx` | Reliability and UX |
| P1-3 | Wire cron for weekly-digest and filter-alerts (Docker or host) | Notifications actually run |
| P1-4 | Add `/api/health` endpoint | Deployment/orchestration |
| P1-5 | Auth UX: wrap Save Filter, Attendance, Favorite in AuthGate or show auth modal on 401 | Visitor flow completion |
| P1-6 | Add events text search input (q param exists, no UI) | Discoverability |
| P1-7 | Zod validation for `api/vendor/events` and `api/user/profile` | Input validation consistency |
| P1-8 | Photo moderation admin UI | Content moderation completeness |

### P2 — Polish / Nice-to-Have

| ID | Item | Rationale |
|----|------|-----------|
| P2-1 | sitemap.xml, robots.txt, canonical URLs, Event schema (JSON-LD) | SEO |
| P2-2 | metadataBase, default OG image, Twitter cards | Social sharing |
| P2-3 | Replace raw `<img>` with `next/image` on event/vendor detail | Performance |
| P2-4 | Event change/cancellation notifications | Engagement |
| P2-5 | Report model + in-app report flow for vendors/events | Trust layer |
| P2-6 | Vendor verification badge | Trust layer |
| P2-7 | Env validation at startup | Fail-fast on misconfiguration |
| P2-8 | DB indexes: `@@index([status, startDate])` on Event, `@@index([createdAt])` on Review | Query performance |

---

## 3. Ticket List (GitHub-Ready)

### P0-1: Fix Open Redirect on callbackUrl

**Why:** Unvalidated `callbackUrl` allows redirect to external sites; phishing risk.

**Acceptance criteria:**
- `callbackUrl` is validated to be same-origin or allowlisted paths (e.g. `/`, `/events`, `/vendor/dashboard`, etc.).
- If invalid, fall back to `/`.
- Unit test: `callbackUrl=https://evil.com` → redirect to `/`.

**Implementation notes:**
- Files: `src/app/auth/signin/sign-in-form.tsx`, `src/app/auth/signup/sign-up-form.tsx`, `src/components/auth-required-modal.tsx`, `src/lib/auth-utils.ts`
- Add `isValidCallbackUrl(url: string): boolean` in `src/lib/utils.ts` (check `url.startsWith("/") && !url.startsWith("//")` or allowlist).

---

### P0-2: Add Unsubscribe Route and List-Unsubscribe Header

**Why:** Digest links to `/unsubscribe` which 404s; CAN-SPAM requires one-click unsubscribe and List-Unsubscribe header.

**Acceptance criteria:**
- `GET /unsubscribe?email=...` page exists; user can unsubscribe (delete from Subscriber or set flag).
- All transactional/digest emails include `List-Unsubscribe` and `List-Unsubscribe-Post` headers (RFC 8058).
- Filter-alerts and vendor-alerts emails include unsubscribe link.

**Implementation notes:**
- Create `src/app/unsubscribe/page.tsx` (form with email pre-filled, submit to `DELETE /api/subscribe?email=...` or similar).
- Add `List-Unsubscribe: <https://spokane.market/unsubscribe?email=...>` to Resend calls in `scripts/weekly-digest.ts`, `scripts/filter-alerts.ts`, `src/lib/vendor-alerts.ts`, `src/lib/send-verification-email.ts`.
- Add `DELETE /api/subscribe` or extend existing subscribe API for unsubscribe.

---

### P0-3: Add Unique Constraints for Reviews and Claims

**Why:** Users can submit multiple claims per market or multiple reviews per event; data integrity.

**Acceptance criteria:**
- Migration adds `@@unique([userId, marketId])` on ClaimRequest (or equivalent to prevent duplicate pending claims).
- Migration adds `@@unique([userId, vendorProfileId])` on VendorClaimRequest.
- Migration adds `@@unique([userId, eventId])` and `@@unique([userId, marketId])` on Review (with conditional logic: exactly one of eventId/marketId set).
- Existing duplicates cleaned or handled before migration.

**Implementation notes:**
- `prisma/schema.prisma`: add unique constraints.
- Run `prisma migrate dev`; handle existing duplicates with a data migration if needed.
- Review creation API: return 409 if duplicate.

---

### P0-4: Add ToS and Privacy Pages

**Why:** Legal baseline; required for trust and many integrations.

**Acceptance criteria:**
- `/terms` and `/privacy` routes exist with placeholder or real content.
- Footer links to both.
- Newsletter/subscribe forms reference Privacy Policy.

**Implementation notes:**
- Create `src/app/terms/page.tsx`, `src/app/privacy/page.tsx`.
- Add links in `src/components/footer.tsx`.
- Update newsletter copy to link to privacy.

---

### P0-5: Add Rate Limiting to Reviews, Uploads, Claims, Vendor-Survey

**Why:** No rate limits on these endpoints; spam and abuse risk.

**Acceptance criteria:**
- Reviews: e.g. 10/hour per user.
- Photo uploads: e.g. 20/hour per user.
- Market/vendor claims: e.g. 5/hour per user.
- Vendor-survey: e.g. 5 req/min per IP (reuse `rate-limit.ts` pattern).
- Return 429 with Retry-After when exceeded.

**Implementation notes:**
- Extend `src/lib/rate-limit.ts` or add DB-based limits.
- Apply in: `src/app/api/reviews/route.ts`, `src/app/api/photos/upload/route.ts`, `src/app/api/upload/image/route.ts`, `src/app/api/markets/claim/route.ts`, `src/app/api/vendors/claim/route.ts`, `src/app/api/vendor-survey/route.ts`.

---

### P1-1: Pagination for Events and Vendors Lists

**Why:** Unbounded queries; poor performance and UX at scale.

**Acceptance criteria:**
- Events list: `?page=1&limit=24` (or cursor-based); default limit 24.
- Vendors list: same pattern.
- UI shows "Load more" or page numbers.

**Implementation notes:**
- `src/app/events/page.tsx`: add `skip`/`take` to Prisma query from searchParams.
- `src/app/vendors/page.tsx`: same.
- Add pagination UI component.

---

### P1-2: Error Boundaries and Custom 404/500

**Why:** No graceful handling of errors; default Next.js pages may leak info or look unpolished.

**Acceptance criteria:**
- `app/error.tsx` exists and shows user-friendly error message.
- `app/not-found.tsx` exists with brand-consistent 404.
- `app/global-error.tsx` exists for root-level errors.

**Implementation notes:**
- Create `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/global-error.tsx`.
- Follow Next.js App Router conventions.

---

### P1-3: Wire Cron for Digest and Filter Alerts

**Why:** Scripts exist but are not run automatically; notifications never fire in production.

**Acceptance criteria:**
- `weekly-digest.ts` runs weekly (e.g. Monday 9am).
- `filter-alerts.ts` runs daily (e.g. 8am).
- Documented in DEPLOY.md; runs in Docker or host cron.

**Implementation notes:**
- Add cron service to `docker-compose.prod.yml` or document host crontab in `DEPLOY.md`.
- Add `"digest": "tsx scripts/weekly-digest.ts"` and `"filter-alerts": "tsx scripts/filter-alerts.ts"` to `package.json`.

---

### P1-4: Add Health Check Endpoint

**Why:** Orchestration and load balancers need readiness checks.

**Acceptance criteria:**
- `GET /api/health` returns 200 when app and DB are reachable.
- Returns 503 if DB unreachable.

**Implementation notes:**
- Create `src/app/api/health/route.ts`.
- Simple `prisma.$queryRaw` or `prisma.$connect()` check.

---

### P1-5: Auth UX for Save Filter, Attendance, Favorite

**Why:** Unauthenticated users get 401 and redirect; should see auth modal or clear CTA.

**Acceptance criteria:**
- Save Filter: wrap in AuthGate or show "Sign in to save" on 401.
- Attendance toggle: show AuthRequiredModal on 401 instead of redirect.
- Favorite vendor: same.

**Implementation notes:**
- `src/components/save-filter-dialog.tsx`, `src/components/attendance-toggle.tsx`, `src/components/favorite-vendor-button.tsx`.
- Use `AuthGate` or catch 401 and open `AuthRequiredModal`.

---

### P1-6: Add Events Text Search Input

**Why:** `q` param is supported in events page but no search field exists.

**Acceptance criteria:**
- Search input in EventFilters or events page.
- Typing and submitting sets `q` and triggers refetch.

**Implementation notes:**
- `src/components/event-filters.tsx` or `src/app/events/page.tsx`.
- Add controlled input for `q`; wire to URL searchParams.

---

### P1-7: Zod Validation for api/vendor/events and api/user/profile

**Why:** `eventId` and profile fields are validated ad-hoc; inconsistent with rest of codebase.

**Acceptance criteria:**
- `api/vendor/events` POST: `z.object({ eventId: z.string().cuid() })`.
- `api/user/profile` PATCH: `z.object({ name: z.string().optional(), image: z.string().url().optional() })` or similar.
- Invalid input returns 400 with schema errors.

**Implementation notes:**
- `src/app/api/vendor/events/route.ts`, `src/app/api/user/profile/route.ts`.
- Add schemas in `src/lib/validations.ts`.

---

### P1-8: Photo Moderation Admin UI

**Why:** Photos have ModerationStatus but no admin queue; they may never be approved.

**Acceptance criteria:**
- `/admin/photos` page lists photos with PENDING status.
- Admin can approve/reject with same pattern as reviews.

**Implementation notes:**
- Create `src/app/admin/photos/page.tsx`.
- Add to admin sidebar.
- Reuse `updatePhotoStatus` pattern from reviews.

---

## 4. Quick Wins (≤1 Day Each)

| # | Task | Files | Effort |
|---|------|-------|--------|
| 1 | Validate `callbackUrl` (same-origin) | sign-in-form, sign-up-form, auth-utils, auth-required-modal | 1–2 hrs |
| 2 | Add `metadataBase` to root layout | `layout.tsx` | 15 min |
| 3 | Add `package.json` scripts for digest and filter-alerts | `package.json` | 5 min |
| 4 | Add Zod schema for `api/vendor/events` POST body | validations.ts, api/vendor/events | 30 min |
| 5 | Add link from "You don't own any markets" to `/markets` | organizer/dashboard | 15 min |
| 6 | Add `aria-label` to admin sidebar toggle, attendance buttons | admin-sidebar, attendance-toggle | 30 min |
| 7 | Add `@@index([status, startDate])` on Event | schema.prisma, migration | 15 min |
| 8 | Replace raw `<img>` with `next/image` on event/vendor detail | events/[slug], vendors/[slug] | 30 min |
| 9 | Add `/api/health` endpoint | api/health/route.ts | 30 min |
| 10 | Add user menu links: Vendor Dashboard, Organizer Dashboard, Admin, Saved Filters | user-menu, navbar-client | 1 hr |

---

## 5. Detailed Findings by Area

### 5.1 Product & UX Flows

| Flow | Status | Gaps |
|------|--------|------|
| Visitor → discover → save/favorite → subscribe | Partial | No search input; Save Filter/Attendance/Favorite show 401→redirect instead of auth modal; no "subscribe to event" flow |
| Vendor → sign up → profile → apply → schedule | Partial | No "apply to event" approval; vendors self-link; no onboarding guidance |
| Organizer → market → events → approve vendors → updates | Partial | Organizers claim markets, not create; no vendor approval; no "send updates" |

**Dead ends:** Organizer dashboard "You don't own any markets" has no link to `/markets`. Vendor events linker shows "No upcoming events" with no link to submit events.

**Accessibility:** Missing `aria-label` on admin menu toggle, attendance buttons; some form errors may not announce to screen readers.

---

### 5.2 Data Model & Domain Integrity

| Entity | Present | Gaps |
|--------|---------|------|
| VendorApplication/Booth | No | VendorEvent links vendor to event; no application/booth model |
| NotificationSubscription | No | Notification (in-app) and Subscriber exist; no per-user preferences |
| EmailLog | No | No audit of sent emails |
| AuditLog | No | No audit trail |
| Report (moderation) | No | No Report model for user reports |

**Constraints:** No `@@unique` on Review (userId+eventId/marketId), ClaimRequest (userId+marketId), VendorClaimRequest (userId+vendorProfileId). Venue has no slug or uniqueness. No soft delete.

**Indexes:** Add `@@index([status, startDate])` on Event; `@@index([createdAt])` on Review for admin ordering.

**Timezone:** No `timezone` field on Event; dates use server timezone.

---

### 5.3 AuthN/AuthZ & Security

| Area | Status | Gaps |
|------|--------|------|
| RBAC | OK | Vendor dashboard uses requireAuth (intentional for self-service) |
| Open redirect | **Vulnerable** | callbackUrl unvalidated |
| Rate limiting | Partial | register, subscribe, newsletter, submissions; missing on reviews, uploads, claims, vendor-survey |
| Input validation | Partial | api/vendor/events, api/user/profile lack Zod |
| CSRF | OK | NextAuth + "use server" |
| Uploads | OK | type restricted; filename from UUID |
| Env validation | Missing | No startup check for DATABASE_URL, AUTH_SECRET |

---

### 5.4 SEO, Performance, Reliability

| Area | Status | Gaps |
|------|--------|------|
| Metadata | Partial | No metadataBase; markets/vendors lack OG; no Twitter cards |
| Sitemap/robots | Missing | No sitemap.ts, robots.txt |
| Structured data | Missing | No Event schema (JSON-LD) |
| Pagination | Missing | Events, vendors unbounded |
| Error handling | Missing | No error.tsx, not-found.tsx, global-error.tsx |
| Email retries | Missing | No retry on Resend failures |
| Health check | Missing | No /api/health |
| Observability | Minimal | console.error only; no tracing, metrics |

---

### 5.5 Notifications & Email

| Area | Status | Gaps |
|------|--------|------|
| Unsubscribe | **Broken** | /unsubscribe 404; List-Unsubscribe header not used |
| Scheduler | Not wired | Cron not in Docker or DEPLOY.md |
| Event change/cancellation | Missing | No notifications when event cancelled |
| Email verification | OK | Signup has verification |
| Newsletter double opt-in | Missing | Subscribes immediately |
| Audit log | Missing | No EmailLog |

---

### 5.6 Admin/Moderation & Trust

| Area | Status | Gaps |
|------|--------|------|
| Report vendors/events | Missing | Only contact email |
| Review moderation | OK | Admin queue at /admin/reviews |
| Photo moderation | Partial | Schema supports; no admin UI |
| Spam controls | Partial | Rate limits on some forms; not reviews/photos |
| Vendor verification badge | Missing | No verificationStatus on VendorProfile |
| ToS/Privacy | Missing | No pages |
| Content guidelines | Missing | None in app |

---

## 6. Unknowns / Questions

- **Recurring events:** `recurrenceGroupId` exists but no metadata or UI; clarify product intent.
- **Multi-date events:** Single startDate/endDate; confirm if multi-date is needed.
- **Geospatial:** Venue has lat/lng; no PostGIS. Is "near me" or distance filter planned?
- **Resend domain:** Confirm `digest@spokane.market` (or similar) is verified for production.
- **Cron host:** Is cron run on the same host as the app or a separate worker? Affects Docker vs host cron choice.

---

## 7. File Reference Summary

| Area | Key Files |
|------|-----------|
| Auth | `src/auth.ts`, `src/lib/auth-utils.ts`, `src/app/auth/signin/sign-in-form.tsx` |
| Validations | `src/lib/validations.ts` |
| Rate limit | `src/lib/rate-limit.ts` |
| Schema | `prisma/schema.prisma` |
| Admin actions | `src/app/admin/actions.ts` |
| Email scripts | `scripts/weekly-digest.ts`, `scripts/filter-alerts.ts`, `src/lib/vendor-alerts.ts`, `src/lib/send-verification-email.ts` |
| Routes | `docs/ROUTES.md` |
| Deploy | `DEPLOY.md`, `docker-compose.prod.yml` |
