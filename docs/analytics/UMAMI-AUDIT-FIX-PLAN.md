# Umami v2 Analytics Audit + Fix Plan

**Date:** 2026-03-07  
**Context:** Umami v2 self-hosted; neither page tracking nor custom events are working.  
**Scope:** Audit only — no implementation.

---

## 1) Repo Recon (What You Found)

### Framework + Routing
- **Framework:** Next.js 15+ (App Router)
- **Routing:** `src/app/` directory structure; `usePathname()` used for SPA navigation

### Where Scripts and Head Are Added
| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout; Umami `<Script>` and GTM inline script in `<html>` |
| `src/components/analytics-loader.tsx` | Dynamic wrapper for `AnalyticsProvider` (ssr: false) |
| `src/components/analytics-provider.tsx` | Client component; calls `trackUmamiPageview()` on pathname change |

### Env Vars (Docker / Runtime)
| Var | Set In | Notes |
|-----|--------|-------|
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | `.env.example`, `docker-compose.yml` (init + web build args), `Dockerfile` ARG/ENV, `deploy.yml` secrets | Baked at build time |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Same; default `https://analytics.spokane.markets/a-smh.js` in layout | Fallback in layout if unset |

### Analytics Wrapper / Hook
| File | Contents |
|------|----------|
| `src/lib/umami.ts` | `trackUmami(eventName, data?)`, `trackUmamiPageview()` — both call `window.umami?.track` / `trackEvent` |
| `src/lib/analytics.ts` | `trackEvent()` — dual-send to GTM (dataLayer) and Umami via `trackUmami()` |
| `src/components/analytics-provider.tsx` | `usePathname()` + `useEffect` → `trackUmamiPageview()` on route change |

### Umami Host / Website ID / Script Path
- **Host URL:** `https://analytics.spokane.markets` (from default script URL)
- **Script path:** `/a-smh.js` (custom name; `TRACKER_SCRIPT_NAME=a-smh` on Umami server)
- **Website ID:** From `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (UUID from Umami dashboard)
- **Caddy:** `analytics.spokane.markets` → `reverse_proxy umami:3000` (Caddyfile line 39)

### Key File Paths (Bullet List)
- `src/app/layout.tsx` — Umami Script tag, data-website-id, data-domains, data-do-not-track
- `src/lib/umami.ts` — trackUmami, trackUmamiPageview; no fallback when window.umami undefined
- `src/components/analytics-provider.tsx` — SPA pageview hook via usePathname
- `src/lib/analytics.ts` — trackEvent → trackUmami for custom events
- `Caddyfile` — analytics.spokane.markets → umami:3000
- `docker-compose.yml` — no `umami` service; Umami deployed separately
- `src/app/debug/analytics/page.tsx` — debug page for Umami/GTM state
- `src/app/api/debug/analytics/route.ts` — API to check env (umami enabled, script URL)

---

## 2) Umami v2 Compatibility Check (March 2026)

### Script URL Format
- **Expected:** Umami v2 default is `/script.js`; custom names via `TRACKER_SCRIPT_NAME` (e.g. `a-smh` → `/a-smh.js`)
- **Current:** `https://analytics.spokane.markets/a-smh.js` — valid if Umami server has `TRACKER_SCRIPT_NAME=a-smh`
- **Verify:** Confirm Umami server env has `TRACKER_SCRIPT_NAME=a-smh` or update layout default to `/script.js`

### Required Attributes
| Attribute | Current | v2 Expectation |
|-----------|---------|----------------|
| `data-website-id` | ✓ Set from env | Required |
| `data-host-url` | ✗ Not set | Optional; script sends to same origin as script by default |
| `data-domains` | ✓ Set to `umamiDomain` (hostname of NEXT_PUBLIC_APP_URL) | Comma list; restricts tracking to listed domains |
| `data-do-not-track` | ✓ `"true"` | Respects DNT; may suppress tracking for DNT users |
| `data-auto-track` | ✗ Not set (default true) | Auto pageviews; we also call `track()` manually — potential duplicate on initial load |

### Auto Track vs Manual
- **Current:** Auto-track enabled (default). `AnalyticsProvider` also calls `trackUmamiPageview()` on pathname change.
- **Risk:** Initial pageview may fire twice (script auto + manual). SPA navigations need manual `track()` — correct.

### Global API
- **v2:** Single `window.umami.track()` with signatures:
  - `track()` — pageview
  - `track(eventName: string)` — event
  - `track(eventName: string, data: object)` — event with data
  - `track(props => ({ ...props, name, data }))` — custom payload
- **v1 legacy:** `trackEvent(name, data)` — removed in v2
- **Current code:** Uses `track()` and `trackEvent` fallback. v2 only has `track`; `trackEvent` will be undefined.

### Proxy / Rewrite
- **Caddyfile:** `analytics.spokane.markets` → `umami:3000`. No path rewrite; `/a-smh.js` and `/api/send` served by Umami.
- **Next.js middleware:** No rewrite for `/umami` or analytics; middleware does not touch static `.js` requests.

---

## 3) Breakpoint Analysis Using Git History

### Commits Touching Umami

| Commit | Message | Files |
|--------|---------|-------|
| `32641dc` | Implement umami | layout, Caddyfile, .env.example, Dockerfile, docker-compose, deploy.yml |
| `ed70e16` | Update layout.tsx | strategy afterInteractive → beforeInteractive |
| `058352d` | update site logo, favicon, fix css issues | (indirect) |
| `2f73f7f` | Update umami.ts | track signature: (name, data) → payload function |
| `c886132` | Update umami.ts | **Removed sendToUmamiApi fallback** |
| `85c5842` | ref | layout: add data-domains, data-do-not-track; strategy beforeInteractive |
| `d3e6c96` | Implement custom umami events with docs | umami.ts, analytics-provider |
| `9076365` | ref | analytics-provider: add trackUmamiPageview |
| `e12ec25` | Update umami.ts | track param optional (typing fix) |

### Last Known Good (Hypothesis)
- **Before `c886132`:** When `window.umami` was undefined, `sendToUmamiApi()` sent events via direct `fetch` to `/api/send`. Events could still reach Umami even if script failed.
- **Commit:** `2f73f7f` or `85c5842` (before fallback removal)

### First Bad (Hypothesis)
- **Commit:** `c886132` — "Update umami.ts"
- **Change:** Removed `sendToUmamiApi()` fallback. When `window.umami` is undefined, `trackUmami` and `trackUmamiPageview` now do nothing.

### Diff Summary (c886132)
```diff
-  } else {
-    sendToUmamiApi(safeName, data);
-  }
+  }
```
And removal of `getUmamiApiHost()` and `sendToUmamiApi()` (~40 lines). Rationale in commit: "direct fetch would create a new session per request and inflate counts." True, but the fallback was the only path when the script never loads or loads late.

---

## 4) Root Cause Matrix

| Symptom | Hypothesis | Evidence | How to Confirm | Fix Approach |
|---------|------------|----------|----------------|---------------|
| No pageviews | Script not loading (404, wrong URL) | layout.tsx line 32: default `a-smh.js`; env may be unset at build | DevTools Network: script 200? | Verify script URL; ensure env at build |
| No pageviews | `data-domains` excludes current host | layout.tsx line 66: `data-domains={umamiDomain}`; umamiDomain = hostname of NEXT_PUBLIC_APP_URL | Debug page: compare dataDomains vs window.location.hostname | Allow multiple domains or derive from current host |
| No pageviews | Script loads after trackUmamiPageview | AnalyticsProvider mounts, useEffect runs; script may still be loading | Debug page: `window.umami` exists? | Wait for script load (onload callback, queue, or delay) |
| No pageviews | DNT blocks tracking | layout.tsx line 66: `data-do-not-track="true"` | Test with DNT off | Document; optionally make configurable |
| No events | `window.umami` undefined at call time | umami.ts: no fallback when track/trackEvent missing | Debug page: track === "function"? | Same as script timing |
| No events | Wrong event API for v2 | umami.ts uses trackEvent as fallback; v2 has only track | v2 docs: trackEvent removed | Remove trackEvent branch; use only track() |
| No events | Fallback removed | c886132 removed sendToUmamiApi | git show c886132 | Restore fallback or fix script loading |
| Script 404 | Wrong script path | Default `a-smh.js`; Umami may use `script.js` | curl https://analytics.spokane.markets/a-smh.js | Align with Umami TRACKER_SCRIPT_NAME |
| CORS / network | Collect endpoint unreachable | Script sends to same origin as script | DevTools Network: POST to /api/send 200? | Check Caddy, Umami CORS |
| Env at build | NEXT_PUBLIC_* not set in Docker build | Dockerfile ARG/ENV; deploy.yml secrets | Build logs: NEXT_PUBLIC_UMAMI_WEBSITE_ID set? | Ensure secrets in CI; verify baked values |

---

## 5) Correct Implementation Plan (No Code — Exact Edits Described)

### 5.1 Where to Load the Script
- **Keep:** `src/app/layout.tsx` inside `<html>`, conditional on `umamiWebsiteId`
- **Change:** Ensure script has `onLoad` or use a ready-check before firing events

### 5.2 Load Once (No Duplicates)
- **Current:** Single `<Script id="umami">` — no duplicate
- **Action:** No change

### 5.3 SPA Page Tracking Hook
- **Current:** `AnalyticsProvider` uses `usePathname()` + `useEffect` → `trackUmamiPageview()`
- **Issue:** `trackUmamiPageview()` may run before `window.umami` exists
- **Fix:**
  1. In `trackUmamiPageview`, if `!window.umami?.track`, either:
     - Queue the call and retry when `window.umami` appears (poll or `MutationObserver`), or
     - Use Script `onLoad` to set a "ready" flag and have AnalyticsProvider wait for it
  2. Consider `data-auto-track="false"` and rely solely on manual `track()` to avoid duplicate initial pageview
  3. Add a short debounce (e.g. 100ms) on pathname change to avoid rapid duplicate pageviews

### 5.4 Safe Analytics Wrapper
- **File:** `src/lib/umami.ts`
- **Changes:**
  1. `trackPageview(url?: string)`: call `window.umami?.track()` (no args = current page). Guard `typeof window !== 'undefined'` and `window.umami` existence. If undefined, optionally queue or retry.
  2. `trackEvent(name: string, props?: Record<string, any>)`: use only `umami.track(name, props)` (v2 API). Remove `trackEvent` fallback. Guard for window and umami. Queue events until script ready if desired.
  3. Add optional event queue: store events when `window.umami` is undefined; flush when it appears (e.g. poll every 100ms for 5s).

### 5.5 Env Vars
- **NEXT_PUBLIC_UMAMI_WEBSITE_ID:** Required for tracking. Must be set at build (Dockerfile ARG, deploy secrets).
- **NEXT_PUBLIC_UMAMI_SCRIPT_URL:** Optional. Default in layout to `https://analytics.spokane.markets/script.js` or confirm `a-smh.js` matches Umami server config.
- **Security:** No secrets in client; both vars are public by design.

### 5.6 Proxy Config
- **Caddyfile:** `analytics.spokane.markets` → `umami:3000` — correct
- **Action:** Ensure Umami service is running and reachable from Caddy (same Docker network or equivalent)
- **Note:** Main `docker-compose.yml` has no `umami` service; deployment must include it separately

### 5.7 data-domains
- **Current:** Single hostname from `NEXT_PUBLIC_APP_URL`
- **Fix:** For local dev, include `localhost` or derive from `window.location.hostname` at runtime. Or use comma list: `spokane.markets,localhost,localhost:3000` when appropriate.

---

## 6) Event Taxonomy for Spokane Markets (Recommended)

| Event | Properties | Notes |
|-------|------------|-------|
| `newsletter_subscribe_success` | — | |
| `save_filter_success` | — | |
| `rsvp_set` | `status`, `event_id` | |
| `add_to_calendar_click` | `provider`, `event_id` | |
| `submit_event_success` | — | |
| `claim_market_click` | `market_id` | |
| `vendor_verification_submit` | — | |
| `vendor_favorite` | `vendor_id` | |
| `vendor_unfavorite` | `vendor_id` | |
| `vendor_external_click` | `vendor_id`, `platform` | |
| `event_view` | `event_id`, `category`, `neighborhood` | |
| `market_view` | `market_id`, `neighborhood` | |
| `vendor_view` | `vendor_id`, `category` | |
| `search_events` | `query_length`, etc. | |
| `filter_applied` | filter params | |
| `login_success` | `method` | |
| `signup_success` | `role` | |
| `consent_accept` | — | |
| `consent_decline` | — | |

**Rules:**
- No PII (no emails, phone numbers, message contents)
- Use stable IDs (`event_id`, `vendor_id`, `market_id`) not names where possible
- Keep props small and consistent (see `docs/analytics/implementation.md` for limits)

---

## 7) QA + Verification Checklist

### DevTools Network
- [ ] Script loads: `https://analytics.spokane.markets/a-smh.js` (or configured URL) returns 200
- [ ] Collect: POST to `https://analytics.spokane.markets/api/send` returns 200 on pageview/event

### Console
- [ ] `window.umami` is defined
- [ ] `typeof window.umami.track === 'function'`
- [ ] Route change (e.g. / → /events) triggers a pageview request
- [ ] Custom event (e.g. favorite vendor) triggers a request with event name and props

### Umami UI
- [ ] Pageviews appear within ~5 minutes
- [ ] Events appear with correct names and properties
- [ ] No duplicate pageviews on initial load (if auto-track + manual both fire)

### Regression
- [ ] No duplicate pageviews on SPA navigation
- [ ] No event spam (e.g. scroll_depth throttled)
- [ ] Works in production behind Caddy with HTTPS
- [ ] Works when `NEXT_PUBLIC_APP_URL` matches actual domain

### Adblock
- [ ] With adblock: script may be blocked; requests may fail. Document expected behavior.
- [ ] Optional: server-side logging of script/collect requests for debugging

---

## 8) Action Plan + Ticket List

### Ticket 1: Fix Script Injection / Base URL
- **Scope:** Verify script URL, env at build, data-domains
- **Files:** `src/app/layout.tsx`, `.env.example`, `Dockerfile`, `deploy.yml`
- **Acceptance criteria:**
  - Script URL matches Umami server (`/script.js` or `TRACKER_SCRIPT_NAME`)
  - `NEXT_PUBLIC_UMAMI_WEBSITE_ID` and `NEXT_PUBLIC_UMAMI_SCRIPT_URL` set at build
  - `data-domains` includes production and dev hostnames
- **QA:** DevTools shows script 200; debug page shows correct scriptSrc and dataDomains

### Ticket 2: Fix SPA Page Tracking Hook
- **Scope:** Ensure trackUmamiPageview runs only when window.umami is ready; avoid duplicates
- **Files:** `src/lib/umami.ts`, `src/components/analytics-provider.tsx`
- **Acceptance criteria:**
  - Pageview fires on route change when umami is ready
  - No double pageview on initial load (align auto-track vs manual)
  - Graceful handling when umami never loads
- **QA:** Navigate SPA; verify one pageview per route in Umami

### Ticket 3: Fix Custom Event Wrapper + Replace Call Sites
- **Scope:** Use only v2 `track()` API; add readiness/queue logic
- **Files:** `src/lib/umami.ts`, `src/lib/analytics.ts`
- **Acceptance criteria:**
  - `trackUmami` uses `umami.track(name, data)` only (remove trackEvent)
  - Events queued or retried when umami not ready
  - All existing `trackEvent` call sites continue to work
- **QA:** Trigger events (favorite, RSVP, etc.); verify in Umami

### Ticket 4: Fix CSP / Proxy Issues (If Found)
- **Scope:** Only if audit finds CSP or proxy blocking
- **Files:** `src/middleware.ts`, `next.config.ts`, `Caddyfile`
- **Acceptance criteria:** No CSP blocking script or collect; proxy serves script and /api/send
- **QA:** Script and collect requests succeed

### Ticket 5: Add Tracking Status Debug Mode (Optional)
- **Scope:** Admin-only debug page showing tracking state
- **Files:** `src/app/debug/analytics/page.tsx`, possibly new admin route
- **Acceptance criteria:** Shows umami ready, script loaded, last event, domain check
- **QA:** Visit as admin; verify info is accurate

### Ticket 6: Add Automated Smoke Test (Optional)
- **Scope:** Playwright test that loads app and asserts tracking calls are attempted
- **Files:** `e2e/` or `tests/`, `playwright.config.ts`
- **Acceptance criteria:** Test loads page, triggers event, checks network for collect request (or mocks)
- **QA:** CI passes

---

*End of audit. No code changes were made.*
