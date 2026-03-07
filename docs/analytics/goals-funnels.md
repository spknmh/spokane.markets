# Goals, Funnels, and Journeys

Configure these in the Umami dashboard as **Goals** (event-based) and use for reporting.

---

## Goals (Single-Event)

| Goal                        | Event                          |
| --------------------------- | ------------------------------ |
| Vendor signup               | `vendor_profile_publish`       |
| Event submission            | `submit_event_success`         |
| Newsletter signup           | `newsletter_subscribe_success` |
| RSVP                        | `rsvp_set`                     |
| Vendor external click (NSM) | `vendor_external_click`        |
| Consent granted             | `consent_accept`               |

---

## Funnels (Multi-Step)

| Funnel               | Steps                                                         |
| -------------------- | ------------------------------------------------------------- |
| Event discovery      | `event_view` → `rsvp_set` or `add_to_calendar_click`          |
| Marketplace          | `market_view` → `vendor_view` → `vendor_external_click`       |
| Vendor onboarding    | `signup_success` (role=vendor) → `vendor_profile_publish`     |
| Organizer onboarding | `signup_success` (role=organizer) → `submit_event_success`    |
| Newsletter           | `newsletter_subscribe_start` → `newsletter_subscribe_success` |

---

## Journeys (Behavioral Flows)

| Journey            | Description                             | Events                                                                              |
| ------------------ | --------------------------------------- | ----------------------------------------------------------------------------------- |
| Maintenance bounce | User hits maintenance; what do they do? | `maintenance_view` → `maintenance_link_click` or `maintenance_duration` (exit)      |
| 404 recovery       | User hits 404; do they go home?         | `not_found_view` → `not_found_go_home_click`                                        |
| Error recovery     | User sees error; retry or leave?        | `error_view` → `error_try_again_click` or `error_go_home_click`                     |
| Content engagement | How far do they scroll?                  | `event_view` / `market_view` → `scroll_depth` (25→50→75→100)                       |
| Search refinement  | Do they get results?                    | `search_events` → `search_zero_results` or `filter_applied` → `filter_zero_results` |
