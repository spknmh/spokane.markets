# North Star Metrics

## Primary North Star Metric

**Vendor Website Clicks** (`vendor_external_click`)

- Captures consumer intent to engage with a vendor (core marketplace value)
- Actionable: improve vendor profiles, discovery, and conversion
- Correlated with vendor retention and marketplace health

---

## Supporting Metrics (Input Drivers)

| Metric                        | Event(s)                                                | Purpose                        |
| ----------------------------- | ------------------------------------------------------- | ------------------------------ |
| Marketplace funnel completion | `market_view` → `vendor_view` → `vendor_external_click` | Conversion funnel              |
| Event engagement              | `rsvp_set`, `add_to_calendar_click`                     | Event discovery and commitment |
| Vendor affinity               | `vendor_favorite`, `vendor_unfavorite`                  | Retention signal               |
| Organizer activity            | `submit_event_success`, `vendor_profile_publish`        | Supply-side health             |
| Discovery quality             | `search_events`, `filter_applied`                        | Demand signals                 |

---

## Event → Metric Mapping

- **NSM**: `vendor_external_click` (platform: website, facebook, instagram)
- **Funnel**: `market_view`, `vendor_view`, `vendor_external_click`
- **Engagement**: `rsvp_set`, `add_to_calendar_click`, `vendor_favorite`, `vendor_unfavorite`
- **Supply**: `submit_event_success`, `vendor_profile_publish`, `vendor_verification_submit`, `claim_market_success`
- **Discovery**: `search_events`, `filter_applied`, `save_filter_success`
