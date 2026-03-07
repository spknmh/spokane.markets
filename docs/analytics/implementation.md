# Analytics Implementation Reference

Where each event is wired and which hooks/components are used.

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
