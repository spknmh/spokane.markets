# Spokane Markets — Analytics + SEO Implementation Plan

**Status:** Planning only — no code implementation.  
**Goal:** Repo-aware plan for GA4, SEO fundamentals, and optional custom analytics.  
**Constraints:** Low-maintenance solutions; avoid heavy infra unless justified.

---

## 1) Repo Recon (Read-only)

### Framework & Patterns
- **Framework:** Next.js 16 (App Router)
- **Rendering:** `force-dynamic` on root layout (`src/app/layout.tsx`); sitemap also dynamic. No SSG; all pages server-rendered per request.
- **Routing:** App Router with `page.tsx`, `layout.tsx`, route groups. No `pages/` directory.

### Metadata & Head
- **Root metadata:** `src/app/layout.tsx` — `metadata` object with `metadataBase`, `title`, `description`, `openGraph`
- **Per-page metadata:** `generateMetadata()` on dynamic pages; static `metadata` export on static pages
- **Pattern:** Next.js `Metadata` API; no `next/head` usage
- **Files with metadata:**
  - `src/app/layout.tsx` — base metadata
  - `src/app/events/[slug]/page.tsx` — `generateMetadata`
  - `src/app/markets/[slug]/page.tsx` — `generateMetadata`
  - `src/app/vendors/[slug]/page.tsx` — `generateMetadata`
  - `src/app/events/page.tsx`, `src/app/events/map/page.tsx`, `src/app/events/calendar/page.tsx` — static `metadata`
  - `src/app/organizer/dashboard/page.tsx`, `src/app/organizer/events/new/page.tsx`, `src/app/organizer/events/[id]/edit/page.tsx`, `src/app/organizer/events/[id]/roster/page.tsx`, `src/app/organizer/markets/[id]/edit/page.tsx`
  - `src/app/dashboard/page.tsx`, `src/app/dashboard/badges/page.tsx`
  - `src/app/terms/page.tsx`, `src/app/privacy/page.tsx`, `src/app/unsubscribe/page.tsx`

### Existing Analytics
- **None.** No GA4, GTM, Plausible, or other analytics scripts.
- Admin page (`src/app/admin/page.tsx`) mentions: *"For full web analytics (page views, traffic), consider adding Plausible, Vercel Analytics, or Google Analytics."*

### Sitemap & Robots
- **Sitemap:** `src/app/sitemap.ts` — dynamic, includes events (PUBLISHED), markets, vendors, static routes
- **Robots:** `src/app/robots.ts` — `allow: /`, sitemap reference
- **Middleware:** `src/middleware.ts` — bypasses maintenance for `/robots.txt`, `/sitemap.xml`

### Structured Data (JSON-LD)
- **None.** No Event, Organization, or LocalBusiness schema. Docs (FEATURE-AUDIT.md, AUDIT-REPORT.md) note this gap.

### Routes (Summary)
| Type | Routes |
|------|--------|
| Public | `/`, `/events`, `/events/[slug]`, `/events/map`, `/events/calendar`, `/markets`, `/markets/[slug]`, `/vendors`, `/vendors/[slug]`, `/submit`, `/about`, `/newsletter`, `/vendor-survey`, `/terms`, `/privacy`, `/landing`, `/maintenance`, `/unsubscribe`, `/unauthorized` |
| Auth | `/auth/signin`, `/auth/signup`, `/auth/verify`, `/auth/request-password-reset` |
| Claim | `/markets/[slug]/claim`, `/vendors/[slug]/claim` |
| Role-specific | `/vendor/dashboard`, `/vendor/profile/edit`, `/vendor/events/link`, `/organizer/dashboard`, `/organizer/events/new`, `/organizer/events/[id]/edit`, `/organizer/events/[id]/roster`, `/organizer/markets/[id]/edit`, `/settings/filters`, `/settings/favorites`, `/dashboard`, `/dashboard/badges`, `/profile`, `/notifications`, `/account/*` |
| Admin | `/admin`, `/admin/*` (events, markets, venues, promotions, content, users, vendors, submissions, reviews, photos, claims, reports, subscribers, audit-log, categories, data, maintenance) |

### Env & Deployment
- **Env file:** `.env.local` (per user rule)
- **Key vars:** `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, `AUTH_SECRET`, `AUTH_*` (OAuth)
- **Docker:** `docker-compose.yml` — `web`, `init`, `db`, `caddy`; `env_file: .env.local`
- **Build:** Next.js standalone output; Prisma migrate + seed in init container

---

## 2) Measurement Strategy

### North Star Metrics
- **Consumer:** Weekly newsletter subscribers + events added to calendar (or RSVP)
- **Vendor:** Verified vendor profiles + vendor intent/roster requests
- **Organizer:** Published events + claimed markets

### Supporting Metrics
- Page views by route
- Filter usage (dateRange, neighborhood, category, feature)
- Event/market/vendor detail views
- Search usage (query length, not raw text)
- Auth funnel (signup start → success, login success)
- Error rates (form_error, api_error)

### Funnels

| Persona | Funnel Steps |
|---------|--------------|
| Consumer | Landing → Browse Events → Filter → Event Detail → Add to calendar / Subscribe / Save filter / RSVP |
| Vendor | Landing → Browse Events → Create vendor profile → Submit for verification → Mark intent / Request roster |
| Organizer | Landing → Submit event → Publish/Approved → Claim market → Manage roster |

---

## 3) GA4 Plan

### Load Strategy
- **Direct GA4** (no GTM) — simpler, fewer dependencies, sufficient for event taxonomy
- **Script loading:** Client component or `next/script` with `strategy="afterInteractive"` in root layout
- **SSR-safe:** GA4 gtag.js is client-only; load in `Providers` or a dedicated `AnalyticsProvider` that mounts only in browser
- **Consent-aware:** Use Google Consent Mode v2; load script only after consent (or with `denied` defaults)

### Event Taxonomy

| Event | Parameters | Notes |
|-------|------------|-------|
| `page_view` | — | Ensure SPA nav tracked (Next.js App Router uses client-side nav; may need `usePathname` + `gtag` on route change) |
| `search_events` | `query_length` (int), `has_date`, `has_neighborhood`, `has_category`, `has_feature` | Never log raw `q` (PII risk) |
| `filter_applied` | `date_range`, `neighborhood`, `category`, `feature` | Fire on filter change (EventFilters, URL change) |
| `event_view` | `event_id`, `category` (slug), `neighborhood` | Fire on event detail mount |
| `market_view` | `market_id`, `neighborhood` | Fire on market detail mount |
| `vendor_view` | `vendor_id`, `category` (specialties slug) | Fire on vendor detail mount |
| `newsletter_subscribe_start` | — | Form focus or first interaction |
| `newsletter_subscribe_success` | — | After successful POST |
| `signup_start` | `role` | Form submit start |
| `signup_success` | `role` | After redirect to signin |
| `login_success` | `method` (credentials/oauth) | After successful sign-in |
| `save_filter_click` | — | Open save-filter dialog |
| `save_filter_success` | — | After successful POST |
| `rsvp_set` | `status` (going/interested), `event_id` | Attendance toggle success |
| `add_to_calendar_click` | `provider` (ics/google/outlook), `event_id` | Per-button click |
| `submit_event_start` | — | Form submit start |
| `submit_event_success` | — | After successful POST |
| `claim_market_click` | `market_id` | Navigate to claim page |
| `claim_market_success` | `market_id` | After successful claim POST |
| `vendor_profile_publish` | — | First-time profile create success |
| `vendor_verification_submit` | — | Verification request submitted |
| `vendor_intent_set` | `status` (attending/interested), `event_id` | EventVendorActions |
| `vendor_roster_request` | `event_id` | Request roster placement |
| `form_error` | `form_id`, `reason` (validation/api) | Coarse only |
| `api_error` | `endpoint`, `status` | Coarse only |

### User Properties
- `role` — consumer / vendor / organizer / admin (from session; do NOT include PII)
- `has_vendor_profile` — boolean

### Conversion Events (GA4)
- `newsletter_subscribe_success`
- `signup_success`
- `save_filter_success`
- `rsvp_set`
- `add_to_calendar_click`
- `submit_event_success`
- `claim_market_success`
- `vendor_profile_publish`
- `vendor_roster_request`

### Debug Strategy
- `NEXT_PUBLIC_GA_DEBUG=1` → enable `gtag('config', 'G-XXX', { debug_mode: true })`
- GA4 DebugView for real-time event verification
- Local dev: only load GA when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set; optionally skip in localhost

---

## 4) Consent and Privacy Plan

### Consent Banner
- **Recommendation:** Yes — GA uses cookies; EU/UK (GDPR), some US states require consent
- **Scope:** Cookie consent for analytics/marketing before loading GA
- **Tool:** Lightweight banner (e.g. custom component or CookieYes/Cookiebot if budget allows); avoid heavy CMP unless needed

### Consent Mode (Google)
- **Default:** `analytics_storage: denied`, `ad_storage: denied` until consent
- **After consent:** `analytics_storage: granted`, `ad_storage: denied` (no ads)
- **Before consent:** GA loads in cookieless mode; modeling may fill gaps (less accurate)

### Data Minimization
- No emails, phone numbers, raw search queries, or free-text in events
- `event_id`, `market_id`, `vendor_id` = internal IDs (opaque); no PII
- `query_length` only for search_events

### IP Anonymization
- GA4 anonymizes IP by default in EU; consider `anonymize_ip: true` globally if desired

### Bot Filtering
- Exclude internal traffic: GA4 filter by IP or custom dimension (e.g. `is_internal: true` when `NEXT_PUBLIC_APP_URL` matches internal IP)
- Exclude admin users: set `user_property` or filter by `role=admin` in GA4
- GA4 built-in bot filtering: keep enabled

---

## 5) SEO Plan

### Technical SEO

#### Titles & Meta Descriptions
| Page Type | Title Pattern | Description Pattern |
|-----------|---------------|---------------------|
| Home | `{SITE_NAME} — Discover Local Markets, Fairs & Events` | Existing |
| Events list | `Events — {SITE_NAME}` | Existing |
| Event detail | `{event.title} — {SITE_NAME}` | `event.description` or fallback |
| Markets list | Add if missing | — |
| Market detail | `{market.name} — {SITE_NAME}` | `market.description` or fallback |
| Vendors list | Add if missing | — |
| Vendor detail | `{vendor.businessName} \| {SITE_NAME}` | Existing |
| Submit | `Submit an Event — {SITE_NAME}` | — |
| About | Add metadata | — |

**Files to touch:** `src/app/markets/page.tsx`, `src/app/vendors/page.tsx`, `src/app/submit/page.tsx`, `src/app/about/page.tsx` — add or refine `metadata` / `generateMetadata`.

#### Canonical URLs
- Add `alternates.canonical` to `metadata` for dynamic pages: event, market, vendor
- Canonical = `{NEXT_PUBLIC_APP_URL}/events/{slug}` (no query params)

#### OpenGraph / Twitter Cards
- Root layout has `openGraph`; event/market/vendor use `generateMetadata` with `openGraph`, `twitter`
- Add `twitter:card`, `twitter:title`, `twitter:description` where missing

#### robots.txt
- Current: `allow: /`, sitemap ref. Add `Disallow: /admin`, `Disallow: /api`, `Disallow: /auth`, `Disallow: /vendor/dashboard`, `Disallow: /organizer/dashboard`, `Disallow: /dashboard`, `Disallow: /settings`, `Disallow: /account` for crawler efficiency.

#### Sitemap Strategy
- **Current:** Single sitemap; events, markets, vendors, static routes
- **Enhancements:**
  - Add `/submit`, `/newsletter`, `/about` if not present
  - Add `lastmod` from DB where available (already done for entities)
  - Consider sitemap index if >50k URLs (unlikely for Spokane)
  - `changeFrequency`: events/markets/vendors `weekly`; home `weekly`; terms/privacy `yearly`

#### Structured Data
- **Event JSON-LD** on `src/app/events/[slug]/page.tsx` — `Event` schema with name, startDate, endDate, location (Place), organizer (Organization), image
- **LocalBusiness/Organization** on market pages — `src/app/markets/[slug]/page.tsx`
- **BreadcrumbList** (optional) — e.g. Home > Events > {title}

#### Filter & Pagination Indexability
- **Indexable:** `/events` (no params), `/events?dateRange=weekend` (curated date presets), `/markets`, `/vendors`
- **noindex:** `/events?page=2`, `/events?q=...`, any URL with `page>1` or many filter combos to avoid index bloat
- **Rule:** Add `robots: { index: false }` to metadata when `page > 1` or when filter combos exceed a threshold (e.g. 3+ active filters)

#### Performance
- Core Web Vitals: use `next/image`, ensure `sizes`; consider `priority` for above-fold images
- SSR for content pages (already dynamic)
- Image sizing: banners use `unoptimized` for some sources; ensure remote patterns in `next.config.ts` cover all domains

### Content Plan (Low-Maintenance)
- **Landing pages:** "This Weekend" = filtered `/events?dateRange=weekend`; avoid thin standalone pages
- **Neighborhoods:** Consider `/events?neighborhood=downtown` as canonical neighborhood pages; add internal links from market/event pages
- **Categories:** Same — `/events?category=crafts`; link from event cards
- **Internal linking:** Event cards → market, vendor; market page → events, vendors; vendor → events
- **Trust messaging:** For "info TBD" or "source not confirmed" — use consistent copy: "Details to be confirmed" or "Unverified listing"

---

## 6) Google Search Console + Bing Webmaster Plan

### Verification
- **Preferred:** DNS TXT record (e.g. `google-site-verification=...`) — most reliable
- **Alternative:** HTML file in `public/` (e.g. `google123.html`)

### Sitemap Submission
- Submit `https://{domain}/sitemap.xml` in GSC and Bing
- Monitor coverage for 404s, excluded URLs, crawl errors

### Monitoring
- **Coverage:** Fix 404s, soft 404s, redirect chains
- **Structured data:** Use GSC Enhancements > Structured data for Event, Organization
- **Query performance:** Track impressions, clicks, CTR, position for target keywords

### IndexNow
- **Recommendation:** Optional; low priority. IndexNow can speed indexing for Bing/Yandex. Implement only if Bing traffic becomes meaningful.

---

## 7) Optional Custom Analytics Plan

### Option A: GA4 Only
- **Pros:** Simplest, lowest maintenance, no extra infra
- **Cons:** Ad blockers reduce coverage; no server-side events; limited per-role cohorts and pipeline visibility

### Option B: Hybrid (GA4 + Lightweight Event Store)
- **Use case:** GA4 cannot reliably give:
  - Per-role activation (vendor verification pipeline, organizer claim funnel)
  - Admin operations (approvals, moderation)
  - Server-side events (newsletter success, API-triggered actions)
- **Data model:**
  ```
  analytics_events: event_name, entity_type, entity_id, user_id (nullable), role, session_id, ts, props_json
  ```
- **Implementation:** Server-side write API (`POST /api/analytics`), rate-limited; write to `analytics_events` table
- **Retention:** 90 days default; configurable
- **Privacy:** No PII in `props_json`; `user_id` hashed or omitted for sensitive events
- **Double-counting:** Use GA for client-side marketing attribution; custom store for product/ops. Do not send same client events to both; or use `source: ga | server` in custom store to dedupe
- **Dashboards:** Simple admin page or SQL queries: signups by role, vendor verification funnel, claim success rate, newsletter subs over time

### Option B Alternative: Umami/Plausible
- Self-hosted Umami or Plausible for privacy-friendly page views
- Complements GA4; use for EU traffic or when GA is blocked
- **Recommendation:** Only if GA4 coverage is poor and team wants a second source

---

## 8) Implementation Plan (Phases + Tickets)

### Phase 0: Baseline SEO Foundations
| ID | Scope | Files | Acceptance Criteria | QA | Rollback |
|----|-------|-------|---------------------|-----|----------|
| SM-SEO-001 | Add canonical URLs to event, market, vendor detail pages | `src/app/events/[slug]/page.tsx`, `src/app/markets/[slug]/page.tsx`, `src/app/vendors/[slug]/page.tsx` | `alternates.canonical` in metadata for each | Check view-source for canonical | Revert metadata |
| SM-SEO-002 | Refine robots.txt disallow rules | `src/app/robots.ts` | Disallow /admin, /api, /auth, /vendor, /organizer, /dashboard, /settings, /account | Fetch /robots.txt, verify rules | Revert robots.ts |
| SM-SEO-003 | Add missing page metadata (markets, vendors, submit, about) | `src/app/markets/page.tsx`, `src/app/vendors/page.tsx`, `src/app/submit/page.tsx`, `src/app/about/page.tsx` | Title + description for each | View-source, GSC | Revert metadata |
| SM-SEO-004 | Add Twitter card meta where missing | Layout, event, market, vendor metadata | `twitter:card`, `twitter:title`, `twitter:description` | Twitter Card Validator | Revert |

### Phase 1: GA4 Integration + Core Events
| ID | Scope | Files | Acceptance Criteria | QA | Rollback |
|----|-------|-------|---------------------|-----|----------|
| SM-AN-001 | GA4 script + consent-aware loader | New `src/components/analytics-provider.tsx`, `src/app/layout.tsx` | Script loads after consent; Consent Mode v2; no GA in dev without env | GA DebugView, no console errors | Remove component, env |
| SM-AN-002 | page_view + SPA navigation | Analytics provider, pathname listener | Page views on route change | Navigate between pages, verify in DebugView | Revert |
| SM-AN-003 | Core content events (event_view, market_view, vendor_view) | Event/market/vendor detail pages | Events fire with correct params | Visit each page type, verify | Revert |
| SM-AN-004 | Filter + search events | `src/components/event-filters.tsx`, events page | filter_applied, search_events with safe params | Change filters, search; verify | Revert |
| SM-AN-005 | Conversion events (newsletter, signup, login, save_filter, rsvp, add_to_calendar) | NewsletterForm, SignUpForm, SignInForm, SaveFilterDialog, AttendanceToggle, AddToCalendar | Each fires on success | Complete each flow, verify | Revert |
| SM-AN-006 | Submission, claim, vendor events | SubmissionForm, ClaimForm, EventVendorActions, VendorProfileForm | submit_event_*, claim_market_*, vendor_* | Complete flows, verify | Revert |
| SM-AN-007 | Error events (form_error, api_error) | Form components, API error boundaries | Coarse reason only | Trigger validation/API error, verify | Revert |
| SM-AN-008 | User properties (role, has_vendor_profile) | Analytics provider, session | Set on session change | Sign in as different roles, verify | Revert |

### Phase 2: Structured Data + Indexability
| ID | Scope | Files | Acceptance Criteria | QA | Rollback |
|----|-------|-------|---------------------|-----|----------|
| SM-SEO-005 | Event JSON-LD | `src/app/events/[slug]/page.tsx` | Valid Event schema in script type="application/ld+json" | Rich Results Test, Schema validator | Revert |
| SM-SEO-006 | Organization/LocalBusiness on market pages | `src/app/markets/[slug]/page.tsx` | Valid schema | Rich Results Test | Revert |
| SM-SEO-007 | noindex for filter/pagination URLs | `src/app/events/page.tsx` | `robots: { index: false }` when page>1 or complex filters | View-source on ?page=2 | Revert |

### Phase 3: Search Console + Bing
| ID | Scope | Files | Acceptance Criteria | QA | Rollback |
|----|-------|-------|---------------------|-----|----------|
| SM-SEO-008 | GSC verification | DNS or HTML file | Verified in GSC | GSC dashboard | Remove verification |
| SM-SEO-009 | Bing verification | DNS or HTML file | Verified in Bing Webmaster | Bing dashboard | Remove |
| SM-SEO-010 | Sitemap submission + monitoring runbook | Docs | Sitemap submitted; runbook for coverage/structured data checks | Manual | — |

### Phase 4 (Optional): Custom Analytics Store
| ID | Scope | Files | Acceptance Criteria | QA | Rollback |
|----|-------|-------|---------------------|-----|----------|
| SM-AN-009 | analytics_events table + write API | Prisma schema, `src/app/api/analytics/route.ts` | POST accepts event_name, entity_*, props; rate-limited | POST test event, verify in DB | Drop table, remove API |
| SM-AN-010 | Server-side event hooks (newsletter, signup, claim) | API routes, server actions | Events written on success | Trigger flows, query DB | Revert |
| SM-AN-011 | Admin analytics view (optional) | `src/app/admin/analytics/page.tsx` | Basic charts or SQL export | View in admin | Revert |

---

## 9) QA Checklist

- [ ] GA pageviews fire on initial load and SPA navigation (no duplicate on back/forward)
- [ ] Conversion events fire once per action (no duplicates from double-click or re-render)
- [ ] No PII in GA payloads (inspect Network tab for gtag requests)
- [ ] Sitemap loads at `/sitemap.xml`, contains expected URLs, valid XML
- [ ] robots.txt loads, disallow rules correct
- [ ] Canonical URLs correct on event, market, vendor pages
- [ ] Structured data validates (Google Rich Results Test, schema.org validator)
- [ ] Filter indexability: `/events` indexable; `/events?page=2` noindex
- [ ] Core Web Vitals pass (LCP, FID, CLS) on key pages
- [ ] Images load with correct sizes, no layout shift

---

## 10) Risks + Non-Goals

### Risks
- **Index bloat:** Filter URLs (e.g. `?neighborhood=x&category=y&feature=z`) — mitigate with noindex for complex combos
- **Duplicate content:** Similar events (same market, different dates) — use canonical, unique titles
- **Tracking blocked:** Ad blockers reduce GA coverage — accept ~20–30% loss; Option B for critical server-side events
- **Consent complexity:** Multiple regions, different rules — start with single consent banner; refine later

### Non-Goals
- Full BI stack (Looker, Metabase, etc.)
- Over-optimizing before content inventory (avoid creating many thin landing pages)
- Real-time dashboards (GA4 + optional admin view sufficient)

---

## First 72 Hours Execution Order

1. **SM-SEO-001** — Canonical URLs (30 min)
2. **SM-SEO-002** — robots.txt disallow (15 min)
3. **SM-SEO-003** — Missing page metadata (45 min)
4. **SM-AN-001** — GA4 script + consent loader (2–3 hrs)
5. **SM-AN-002** — page_view + SPA nav (1 hr)
6. **SM-AN-003** — event_view, market_view, vendor_view (1.5 hrs)
7. **SM-SEO-005** — Event JSON-LD (1 hr)

Total: ~7–8 hours for baseline SEO + GA4 foundation. Remaining tickets in Phase 1–2 can follow in next sprint.
