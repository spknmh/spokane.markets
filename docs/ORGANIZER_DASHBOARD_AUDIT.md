# Organizer Dashboard Audit

**Date:** March 3, 2025

## Summary

Audit of the organizer dashboard identified UI/UX bugs and missing feature implementations. The following fixes were applied.

---

## Issues Fixed

### 1. Events query excluded market-owned events

**Problem:** The dashboard only showed events where `submittedById === userId`. Market owners who didn't submit an event (e.g., admin-created events for their market) could not see or manage them, even though `canManageEventRoster` grants market owners roster access.

**Fix:** Events query now uses `OR: [{ submittedById: userId }, { market: { ownerId: userId } }]` so organizers see all events they can manage.

### 2. No visibility into pending vendor requests

**Problem:** Organizers had to open each event's roster page to see if vendors had requested to join. No aggregated count or alert.

**Fix:**
- Added `EventVendorIntent` groupBy query for REQUESTED/APPLIED status
- Banner when `totalPendingRequests > 0`: "X vendor request(s) pending review" with link to #events
- Roster button shows pending count: "Roster (3)" when applicable

### 3. Events ordered wrong (past first)

**Problem:** Events were ordered by `startDate: "desc"`, so past events appeared first. Organizers typically care about upcoming events.

**Fix:**
- Order changed to `startDate: "asc"` (upcoming first)
- Section split into "Upcoming" and "Past"
- Past events styled with `opacity-80` to de-emphasize

### 4. Redundant sidebar navigation

**Problem:** Sidebar had "Overview", "Your Markets", "Your Events" — all linking to the same page with different hashes. Cluttered and redundant.

**Fix:** Simplified to "Overview", "Submit Event", "Browse Markets". Sections are visible on the Overview page.

### 5. No "Add vendor" in roster manager

**Problem:** Organizers could only approve/reject requests. No way to manually add a vendor to the roster (e.g., for INVITE_ONLY or to add vendors who didn't request).

**Fix:**
- Added `/api/organizer/vendors/search` for vendor search by business name/slug
- "Add vendor" button in Official Roster card
- Dialog with debounced search, results filtered to exclude roster/pending
- Disabled when at capacity (for capacity-limited events)

### 6. Weak empty state for events

**Problem:** "You haven't submitted any events yet" with no clear CTA.

**Fix:** Card with dashed border, centered message, and "Submit Your First Event" button.

### 7. No "View" link to public event page

**Problem:** Event cards had Edit and Roster but no direct link to the public event page.

**Fix:** Added "View" button linking to `/events/[slug]`.

---

## Files Changed

- `src/app/organizer/dashboard/page.tsx` — Events query, pending counts, Upcoming/Past split, empty state, View button
- `src/app/organizer/layout.tsx` — Simplified nav items
- `src/components/organizer-roster-manager.tsx` — Add vendor dialog and search
- `src/app/api/organizer/vendors/search/route.ts` — New vendor search API

---

## Remaining Considerations

1. **Dashboard sidebar "My Dashboard"** — Links to `/dashboard` (general user dashboard). Organizers can switch context; consider renaming to "My Account" or "Consumer Dashboard" if confusion arises.

2. **Market edit** — Organizers cannot edit market details (only admins). Market cards link to public market page. This is by design.

3. **Notifications** — No in-app notification when a new vendor request arrives. Consider adding notification badge or email alert for organizers.
