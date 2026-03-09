# Analytics Implementation Reference

Where each event is wired and which hooks/components are used.

---

## Umami Event Data Limits

When adding or modifying Umami events, respect these limits (enforced by Umami):

| Limit | Value |
| ----- | ----- |
| Event names | max 50 chars (truncated in `trackUmami` with dev warning) |
| Object properties | max 50 per event |
| Strings | max 500 chars |
| Numbers | max 4 decimal precision |
| Arrays | converted to string, max 500 chars |

---

## Content-Security-Policy (CSP)

If you add a Content-Security-Policy (e.g. in `next.config.ts` or middleware), you must allowlist the Umami host so the tracker script and collect endpoint work:

- **script-src:** include `https://analytics.spokane.markets` (or your `NEXT_PUBLIC_UMAMI_SCRIPT_URL` origin).
- **connect-src:** include the same origin so the script can send events to `/api/send`.

Without these, the Umami script may be blocked and `window.umami` will never be defined.

---

## Umami Readiness

When `window.umami` is not yet available (script load race), events and pageviews are queued in `src/lib/umami.ts`. A poll runs every 100ms for up to 5s; when the script loads, the queue is flushed. If the script never loads, a one-time dev warning is logged and queued items are dropped.

**Duplicate prevention:** The Umami script is loaded with `data-auto-track="false"`. `AnalyticsProvider` sends the initial pageview and every SPA route change via `trackUmamiPageview()` with a 150ms debounce, so there is exactly one pageview per route (including first load).

**Event data format:** Events with custom data use the payload-function form `track(props => ({ ...props, name, data }))` rather than `track(name, data)`. The two-arg form can fail to include the data field in some Umami versions/scripts.

---

## Hooks

| Hook               | File                         | Purpose                                      |
| ------------------ | ---------------------------- | -------------------------------------------- |
| `usePageDuration`  | `src/hooks/use-page-duration.ts`  | Fire event with `seconds_elapsed` on visibilitychange/beforeunload |
| `useScrollDepth`   | `src/hooks/use-scroll-depth.ts`   | Fire `scroll_depth` at 25, 50, 75, 100%      |

---

## Dead-End / Passive Pages

| Page         | Component                 | Events                                                                 |
| ------------ | -------------------------- | ---------------------------------------------------------------------- |
| Maintenance  | `MaintenanceTracker`       | `maintenance_view`, `maintenance_link_click`, `maintenance_duration`   |
| 404          | `NotFoundTracker`          | `not_found_view`, `not_found_go_home_click`                            |
| Unauthorized | `UnauthorizedTracker`      | `unauthorized_view`, `unauthorized_return_click`, `unauthorized_duration` |
| Error        | `Error` (error.tsx)        | `error_view`, `error_try_again_click`, `error_go_home_click`, `error_duration` |
| Global Error | `GlobalError`              | `error_view`, `error_try_again_click`                                  |
| Landing      | `LandingTracker`           | `landing_view`, `landing_duration`                                     |

---

## Consent

| Component       | Events             |
| --------------- | ------------------ |
| `ConsentBanner` | `consent_accept`, `consent_decline` |

---

## Empty States

| Component                  | Events                     |
| -------------------------- | -------------------------- |
| `EventsEmptyStateTracker`  | `search_zero_results`, `filter_zero_results` |

---

## Scroll Depth

| Page           | Component / Location      |
| -------------- | ------------------------- |
| Homepage       | `HomeScrollDepth`         |
| Event detail   | `TrackEventView`          |
| Market detail  | `TrackMarketView`         |
| Vendor profile | `TrackVendorView`         |

---

## Core Tracking (Existing)

| Event / Action        | Component / Location      |
| --------------------- | ------------------------- |
| `event_view`          | `TrackEventView`          |
| `market_view`         | `TrackMarketView`         |
| `vendor_view`         | `TrackVendorView`         |
| `vendor_external_click` | `VendorSocialLinks`     |
| `vendor_favorite`     | `FavoriteVendorButton`    |
| `vendor_unfavorite`   | `FavoriteVendorButton`    |
| `search_events`       | `EventFilters`            |
| `filter_applied`      | `EventFilters`            |
