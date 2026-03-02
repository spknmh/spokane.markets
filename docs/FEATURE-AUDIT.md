# Spokane.market — Feature Audit & Product Review

**Date:** 2025-03-02  
**Scope:** Hyper-local markets platform (events, vendors, organizers, reviews, favorites, notifications)  
**Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma/Postgres, NextAuth v5 beta

---

## A) Executive Summary (12 bullets)

1. **ToS/Privacy are placeholders** — `src/app/terms/page.tsx` and `src/app/privacy/page.tsx` contain "This is a placeholder"; legal/trust risk.
2. **No share or add-to-calendar** — Event detail has no Share button, ICS download, or add-to-calendar; users must copy URLs manually.
3. **SEO gaps** — No sitemap, robots.txt, metadataBase, canonical URLs, or Event JSON-LD; limits crawlability and rich results.
4. **Vendor self-link only** — Vendors link to events without application/approval; no organizer–vendor workflow, status tracking, or booth info.
5. **Organizers cannot create markets** — Market creation is admin-only; organizers only claim existing markets.
6. **No in-app reporting** — No Report model or "flag this" UI; users cannot flag vendors, events, or reviews.
7. **Markets/vendors discovery is shallow** — No search or filters on `/markets` or `/vendors`; events have full filters.
8. **Dialog accessibility** — `src/components/ui/dialog.tsx` lacks focus trap, Escape handler, and ARIA roles; keyboard users are blocked.
9. **No skip link** — No "Skip to main content" for screen reader users.
10. **Vendor analytics missing** — No profile views, contact clicks, or per-vendor analytics; only favorites count on dashboard.
11. **Event timezone missing** — Events stored in server timezone only; no user-local or venue timezone support.
12. **Market owner cannot edit market events** — Authz uses `submittedById`; market owner who didn't submit cannot edit.

---

## B) Feature Gap Matrix

| Area | Feature | Status | Impact | Evidence | Recommendation |
|------|---------|--------|--------|----------|-----------------|
| **Public** | Event search/filters | Exists | — | `event-filters.tsx`, `events/page.tsx` | — |
| **Public** | Markets search/filters | Missing | High | `markets/page.tsx` — alphabetical list only | Add search input, neighborhood/category filters |
| **Public** | Vendors search/filters | Missing | High | `vendors/page.tsx` — pagination only | Add search by name/specialty |
| **Public** | Share button | Missing | Med | — | Add Share (Web Share API + fallback) |
| **Public** | ICS / add-to-calendar | Missing | Med | — | Add ICS download, Google/Outlook links |
| **Public** | Embedded map on event | Missing | Med | `events/[slug]/page.tsx` — directions link only | Add Leaflet/Mapbox embed |
| **Public** | Sitemap | Missing | High | — | Add `app/sitemap.ts` |
| **Public** | robots.txt | Missing | High | — | Add `app/robots.ts` |
| **Public** | metadataBase | Missing | High | `layout.tsx` | Add for correct OG image URLs |
| **Public** | Event JSON-LD | Missing | High | — | Add structured data in event detail |
| **Public** | Canonical URLs | Missing | Low | — | Add `alternates.canonical` |
| **User** | Favorites | Exists | — | `favorite-vendor-button.tsx`, `FavoriteVendor` | — |
| **User** | Reviews | Exists | — | `review-form.tsx`, `review-list.tsx` | Add verified-attendee signal |
| **User** | Notifications | Exists | — | `notifications/`, `lib/notifications.ts` | — |
| **User** | Unsubscribe | Exists | — | `unsubscribe/page.tsx`, List-Unsubscribe headers | — |
| **User** | Email preference center | Partial | Med | Settings scattered (filters, favorites) | Add unified preference page |
| **Trust** | ToS/Privacy content | Placeholder | High | `terms/page.tsx`, `privacy/page.tsx` | Replace with real legal content |
| **Trust** | Report/flag flow | Missing | High | No Report model | Add Report model, "Flag" UI, admin queue |
| **Trust** | Vendor verification badge | Missing | Med | `VendorProfile` has no `verificationStatus` | Add field + badge |
| **Trust** | Verified attendee on reviews | Missing | Med | No link Attendance↔Review | Add signal or flag |
| **Trust** | Review text max length | Missing | Med | `reviewSchema` text unbounded | Add `z.string().max(2000)` |
| **Vendor** | Profile create/edit | Exists | — | `vendor/profile/edit`, `vendor-profile-form.tsx` | — |
| **Vendor** | Event linking | Exists | — | `vendor/events/link`, `vendor-event-linker.tsx` | Self-link only |
| **Vendor** | Application workflow | Missing | High | No apply→approve flow | Add VendorEventApplication, status, organizer approval |
| **Vendor** | Profile completeness | Missing | Med | No checklist | Add completeness score + CTA |
| **Vendor** | Photo gallery | Partial | Med | Single `imageUrl` only | Consider multi-photo |
| **Vendor** | Profile views / contact clicks | Missing | High | No tracking | Add lightweight analytics |
| **Vendor** | Autosave / drafts | Missing | Med | Single submit | Add debounced autosave |
| **Organizer** | Create events | Exists | — | `organizer/events/new`, API | — |
| **Organizer** | Create market | Missing | High | Admin-only at `admin/markets/new` | Allow organizer market creation or request flow |
| **Organizer** | Vendor recruitment | Missing | High | Vendors self-link | Add invite/application flow |
| **Organizer** | Organizer messaging | Missing | High | No organizer→vendor/attendee email | Add broadcast or notifications |
| **Organizer** | Event templates | Missing | Med | — | Add "duplicate event" or templates |
| **Organizer** | Recurring events | Schema only | Med | `recurrenceGroupId` unused | Implement recurrence UI |
| **Organizer** | Cancel event | Partial | Med | Admin can; organizer cannot | Add status field to organizer form |
| **Organizer** | Vendor roster management | Partial | Med | Public roster visible; no organizer view | Add organizer roster + approvals |
| **Organizer** | Check-in / printable roster | Missing | Med | — | Add roster export |
| **Organizer** | Multi-organizer roles | Missing | High | Single `ownerId` per market | Add MarketMember with role |
| **Admin** | Moderation queues | Exists | — | Reviews, photos, submissions, claims | — |
| **Admin** | Report/flag queue | Missing | High | — | Add when Report exists |
| **Technical** | Event timezone | Missing | High | `schema.prisma` Event | Add `timezone` field |
| **Technical** | Soft delete | Missing | Med | Hard deletes only | Add `deletedAt` for audit |
| **Technical** | Pagination (markets, admin) | Missing | Med | Unbounded `findMany` | Add pagination |
| **Technical** | Rate limit (Redis) | Partial | Med | In-memory; multi-instance fails | Use @upstash/ratelimit |
| **Technical** | Market owner event edit | Bug | Med | Authz uses `submittedById` | Allow `market.ownerId` to edit |

---

## C) Top QoL Wins (≤10, 1–2 days each)

| # | Win | Files | Effort |
|---|-----|-------|--------|
| 1 | **Sitemap + robots.txt** | `app/sitemap.ts`, `app/robots.ts` | 0.5 day |
| 2 | **metadataBase + default OG** | `layout.tsx`, `next.config.ts` | 0.25 day |
| 3 | **Share button on event** | `events/[slug]/page.tsx`, new ShareButton | 0.5 day |
| 4 | **ICS add-to-calendar** | `events/[slug]/page.tsx`, `lib/ics.ts` | 0.5 day |
| 5 | **Markets search input** | `markets/page.tsx`, add `q` param + Input | 0.5 day |
| 6 | **Vendors search input** | `vendors/page.tsx`, add `q` param + Input | 0.5 day |
| 7 | **Skip to main content** | `layout.tsx` | 0.25 day |
| 8 | **Dialog focus trap + Escape** | `components/ui/dialog.tsx` or migrate to Radix | 0.5 day |
| 9 | **Review text max length** | `validations.ts`, `review-form.tsx` | 0.25 day |
| 10 | **Organizer dashboard link in user menu** | `user-menu.tsx`, `navbar-client.tsx` | 0.25 day |

---

## D) P0 / P1 / P2 Roadmap

### P0 — Launch Blockers (Trust / Security / Core Flows)

| ID | Item | Rationale |
|----|------|-----------|
| P0-1 | Replace ToS/Privacy placeholders | Legal baseline; current content says "placeholder" |
| P0-2 | Add Report model + in-app flag flow | Users cannot report abuse; trust/safety gap |
| P0-3 | Event timezone field | Events display wrong for non-local users |

### P1 — Adoption / Retention Multipliers

| ID | Item | Rationale |
|----|------|-----------|
| P1-1 | Sitemap, robots.txt, metadataBase, Event JSON-LD | SEO and discoverability |
| P1-2 | Share + ICS add-to-calendar | Engagement and calendar integration |
| P1-3 | Markets and vendors search | Discovery parity with events |
| P1-4 | Vendor application workflow | Organizer–vendor trust; replace self-link |
| P1-5 | Vendor verification badge | Trust signal |
| P1-6 | Dialog accessibility (focus trap, Escape, ARIA) | Accessibility compliance |
| P1-7 | Skip link | Accessibility baseline |
| P1-8 | Market owner can edit market events | Authz fix |
| P1-9 | Organizer can cancel events | Operational necessity |
| P1-10 | Pagination for markets + admin lists | Scale |

### P2 — Polish / Nice-to-Have

| ID | Item | Rationale |
|----|------|-----------|
| P2-1 | Embedded map on event detail | UX polish |
| P2-2 | Vendor profile completeness checklist | Onboarding quality |
| P2-3 | Vendor analytics (views, contact clicks) | Vendor retention |
| P2-4 | Recurring events UI | Organizer efficiency |
| P2-5 | Event templates / duplicate | Organizer efficiency |
| P2-6 | Unified email preference center | User control |
| P2-7 | Verified attendee on reviews | Trust signal |
| P2-8 | Soft delete | Audit trail |
| P2-9 | Redis rate limiting | Multi-instance production |
| P2-10 | Multi-organizer roles | Market team collaboration |

---

## E) Ticket Pack (GitHub-Ready)

### Ticket 1: Replace ToS and Privacy Placeholders

**Problem:** Terms and Privacy pages contain "This is a placeholder. Please replace with your actual..." — not suitable for production.

**Acceptance criteria:**
- [ ] `/terms` and `/privacy` contain real, jurisdiction-appropriate legal content
- [ ] Footer links work; pages are readable and properly formatted
- [ ] Contact/update mechanism noted (e.g. "Last updated" date)

**Implementation notes:**
- Files: `src/app/terms/page.tsx`, `src/app/privacy/page.tsx`
- Consider legal review or template (e.g. Termly, iubenda, or counsel)
- Add `lastUpdated` or similar in metadata

**QA notes:** Verify links from footer, signup flow (if ToS checkbox exists), and mobile layout.

---

### Ticket 2: Add Report Model and In-App Flag Flow

**Problem:** Users cannot flag inappropriate vendors, events, or reviews. No structured reporting.

**Acceptance criteria:**
- [ ] Report model: `userId`, `targetType` (EVENT|MARKET|VENDOR|REVIEW), `targetId`, `reason`, `status`, `createdAt`
- [ ] "Report" or "Flag" button on event detail, market detail, vendor detail, review card
- [ ] Modal/form to select reason (spam, inappropriate, other) and optional notes
- [ ] Admin queue at `/admin/reports` with list and resolve/ignore actions
- [ ] Rate limit: 5 reports/hour per user

**Implementation notes:**
- Schema: `prisma/schema.prisma` — add Report model
- API: `src/app/api/reports/route.ts` (POST), `src/app/api/admin/reports/[id]/route.ts` (PATCH)
- Components: `ReportButton`, `ReportDialog`; add to event-card, review-list, vendor/market detail
- Admin: `src/app/admin/reports/page.tsx`; add to admin sidebar

**QA notes:** Test as non-admin (flag), as admin (queue), rate limit, and rejected/invalid targets.

---

### Ticket 3: Add Sitemap and robots.txt

**Problem:** No sitemap or robots.txt; search engines may not crawl effectively.

**Acceptance criteria:**
- [ ] `GET /sitemap.xml` returns valid sitemap with events, markets, vendors, static pages
- [ ] `GET /robots.txt` returns valid robots with Sitemap reference
- [ ] Sitemap uses `NEXT_PUBLIC_APP_URL` for base URL
- [ ] Events/markets/vendors use `lastmod` where available

**Implementation notes:**
- Files: `src/app/sitemap.ts`, `src/app/robots.ts` (Next.js convention)
- Query published events, markets, vendors; add `/`, `/events`, `/markets`, `/vendors`, `/about`, etc.
- Reference: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

**QA notes:** Validate sitemap XML, robots.txt format, and that crawlers can fetch.

---

### Ticket 4: Add Share and ICS Add-to-Calendar

**Problem:** No way to share events or add them to calendar; users copy URLs manually.

**Acceptance criteria:**
- [ ] Share button on event detail: Web Share API when available, fallback copy URL
- [ ] "Add to calendar" section: ICS download + links to Google Calendar, Outlook
- [ ] ICS includes title, description, start/end, location (venue address)

**Implementation notes:**
- Share: `src/components/share-button.tsx`; add to `src/app/events/[slug]/page.tsx`
- ICS: `src/lib/ics.ts` — `generateEventIcs(event)`; blob download
- Google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&location=...`
- Outlook: `https://outlook.live.com/calendar/0/action/compose&subject=...&startdt=...&enddt=...&location=...`

**QA notes:** Test on mobile (Web Share), desktop (copy), ICS in Apple/Google/Outlook.

---

### Ticket 5: Add Markets and Vendors Search

**Problem:** Markets and vendors pages have no search; discovery is limited.

**Acceptance criteria:**
- [ ] Markets: search input, `q` param filters by `name` or `description` (case-insensitive)
- [ ] Vendors: search input, `q` param filters by `businessName`, `specialties`, or `description`
- [ ] Search persists in URL; works with pagination
- [ ] Empty state when no results

**Implementation notes:**
- Markets: `src/app/markets/page.tsx` — add `q` to searchParams, `where.OR` for name/description
- Vendors: `src/app/vendors/page.tsx` — add `q`, `where.OR` for businessName/specialties/description
- Reuse pattern from `src/app/events/page.tsx` (query, filters)
- Add Input to page header or sidebar

**QA notes:** Test empty query, partial match, pagination with search, URL sharing.

---

### Ticket 6: Dialog Accessibility (Focus Trap, Escape, ARIA)

**Problem:** Custom Dialog lacks focus trap, Escape key handler, and ARIA; keyboard/screen reader users cannot use modals properly.

**Acceptance criteria:**
- [ ] Focus trapped when dialog open; Tab cycles within dialog
- [ ] Escape closes dialog
- [ ] `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- [ ] Focus returns to trigger on close
- [ ] Backdrop click still closes (optional)

**Implementation notes:**
- Option A: Migrate to `@radix-ui/react-dialog` (has all of above)
- Option B: Add focus-trap logic, `useEffect` for Escape, ARIA attributes manually in `src/components/ui/dialog.tsx`
- Ensure `DialogContent` receives `id` for `aria-labelledby`/`aria-describedby`

**QA notes:** Test with keyboard only; test with NVDA/VoiceOver; verify no focus escape.

---

## F) UX/UI Suggestions

### Navigation / IA

- Add **breadcrumbs** to event detail, market detail, vendor detail, admin sub-pages (e.g. `/admin/events/[id]/edit`).
- Add **Organizer Dashboard** link in user menu when user has ORGANIZER role or owns a market.
- Add **Vendor Dashboard** link in user menu when user has VENDOR role.
- Consider **Settings** dropdown in user menu: Profile, Filters, Favorites, (future: Notifications, Privacy).

### Search / Filter Patterns

- **Events:** Current sidebar filters are good; consider moving "Saved filters" badges above results for visibility.
- **Markets:** Add filters for neighborhood (baseArea), or reuse NEIGHBORHOODS constant.
- **Vendors:** Add filter by specialty (e.g. tags/categories) or "appearing at event X".
- **Unified search:** Consider global search (events + markets + vendors) in navbar for power users.

### Event Detail Layout

- **Above the fold:** Image, title, date/time, location, primary CTA (Going/Interested or Add to calendar).
- **Secondary:** Description, features, vendors, reviews.
- **Add:** "What to expect" section if schema supports it; accessibility notes; parking info more prominent.
- **Map:** Embed small map (Leaflet) with venue pin; optional "View larger map" for directions.

### Vendor Profile Layout

- **Hero:** Image, name, specialty badges, verified badge (when implemented).
- **Social:** Website, Facebook, Instagram — make prominent.
- **Upcoming:** "Where We'll Be Next" — already exists; consider making it the primary CTA.
- **Contact:** Add optional phone/email if schema supports; optional payment methods (Venmo, etc.).

### Mobile-First Fixes

- **Sticky CTA:** On event detail, consider sticky "Add to calendar" or "Going" at bottom on mobile.
- **Filters:** On events, mobile filter drawer could be improved (e.g. slide-up sheet).
- **Tables:** Admin tables (events, markets, venues) may overflow on small screens; consider card layout on mobile.
- **Touch targets:** Ensure buttons/links are at least 44×44px for touch.

### Accessibility Fixes

- **Skip link:** Add `<a href="#main" class="skip-link">Skip to main content</a>` at top of body; `#main` on `<main>`.
- **Labels:** Add `aria-label` or `<Label>` to footer newsletter input, home subscribe input.
- **Attendance buttons:** Add `aria-label` (e.g. "Mark as Going").
- **User menu:** Add `aria-expanded`, `aria-haspopup`; keyboard nav (arrow keys).
- **Star rating:** Add `role="radiogroup"` and `aria-label` for group.
- **Admin sidebar toggle:** Add `aria-label="Toggle admin menu"`.

---

## Appendix: Route Map

| Type | Routes |
|------|--------|
| **Public** | `/`, `/events`, `/events/[slug]`, `/markets`, `/markets/[slug]`, `/vendors`, `/vendors/[slug]`, `/submit`, `/vendor-survey`, `/newsletter`, `/about`, `/terms`, `/privacy`, `/unsubscribe` |
| **Auth** | `/auth/signin`, `/auth/signup`, `/auth/verify` |
| **User** | `/profile`, `/settings/filters`, `/settings/favorites`, `/notifications` |
| **Vendor** | `/vendor/dashboard`, `/vendor/profile/edit`, `/vendor/events/link`, `/vendors/[slug]/claim` |
| **Organizer** | `/organizer/dashboard`, `/organizer/events/new`, `/organizer/events/[id]/edit`, `/markets/[slug]/claim` |
| **Admin** | `/admin`, `/admin/analytics`, `/admin/banners`, `/admin/landing`, `/admin/users`, `/admin/events`, `/admin/markets`, `/admin/venues`, `/admin/submissions`, `/admin/reviews`, `/admin/photos`, `/admin/claims`, `/admin/subscribers` |

---

## Appendix: Key Schema Models

| Model | Key Fields |
|-------|------------|
| Event | title, slug, startDate, endDate, status, venueId, marketId, recurrenceGroupId |
| Market | name, slug, verificationStatus, ownerId, typicalSchedule |
| VendorProfile | businessName, slug, userId, specialties, imageUrl |
| VendorEvent | vendorProfileId, eventId (link only; no status/booth) |
| Review | userId, eventId, marketId, rating, text, status |
| Photo | url, reviewId, eventId, marketId, status |
| SavedFilter | userId, name, dateRange, neighborhoods, categories, features, emailAlerts |
| FavoriteVendor | userId, vendorProfileId, emailAlerts |
| Notification | userId, type, title, body, link, readAt |
| SiteConfig | key, value (banners, landing) |
