# Build Plan: Featured/Sponsored Section + Plan in Advance

**Goal:** Add home page sections for (1) sponsored/featured bigger markets and (2) "Plan in Advance" for farther-out events, while keeping "This Weekend" intact.

---

## Proposed Home Page Layout (Final Order)

| Order | Section | Content | Purpose |
|-------|---------|---------|---------|
| 1 | Hero | Unchanged | Brand + CTAs |
| 2 | **Featured / Sponsored** | Paid/partnership events | Monetization, bigger markets |
| 3 | This Weekend | Organic, Sat–Sun | Immediate discovery |
| 4 | **Plan in Advance** | Organic, farther out | Longer-term planning |
| 5 | Newsletter | Unchanged | Email signup |

---

## Decision Points (Please Answer)

### 1. Data Model for Featured/Sponsored Content

**Option A — Event-level flags (simpler)**  
- Add to `Event`: `featuredUntil` (DateTime?), `sponsorName` (String?), `placement` (String?)
- Pros: No new tables, quick to ship
- Cons: Only promotes existing events; no standalone ads/partnership banners

**Option B — Separate `Promotion` table (flexible)**  
- New model: `Promotion` with `eventId?`, `type` (SPONSORED | PARTNERSHIP | PAID), `sponsorName`, `imageUrl`, `linkUrl`, `startDate`, `endDate`, `placement`
- Pros: Can promote non-events (e.g. "Partner with us"), campaigns independent of events
- Cons: More schema + admin UI work

**Your choice:** [ ] A  [ ] B

---

### 2. Plan in Advance — Date Range

**Option A — Next 2–4 weeks (14–28 days)**  
- Events starting 14–28 days from today
- Excludes this weekend and next 7 days (avoids overlap with "This Weekend" and "Next 7 Days")

**Option B — Next 30 days, excluding this weekend**  
- Events from end of this weekend through 30 days out
- Simpler logic, may overlap with "Next 7 Days" conceptually

**Option C — Next month (calendar month)**  
- Events in the next full calendar month
- Aligns with existing `month` filter

**Your choice:** [ ] A  [ ] B  [ ] C

---

### 3. Featured Section — Display Style

**Option A — Grid (same as This Weekend)**  
- 2-column grid of EventCards with "Featured" or "Sponsored" badge
- Consistent with rest of page

**Option B — Carousel / horizontal scroll**  
- 3–4 cards visible, scroll for more
- More prominent, better for fewer high-value items

**Option C — Hero-style spotlight (1–2 large cards)**  
- 1–2 large featured cards, then optional smaller grid
- Best for 1–2 premium sponsors

**Your choice:** [ ] A  [ ] B  [ ] C

---

### 4. Featured Section — Item Limit

- How many featured items to show on the home page?
- Suggested: 4–6 for grid, 4–8 for carousel, 1–2 for hero spotlight

**Your choice:** ____ (number)

---

### 5. Plan in Advance — Item Limit

- How many events to show? (This Weekend currently shows 8)

**Your choice:** ____ (number) — or "same as This Weekend (8)"

---

### 6. Sponsor Labeling

**Option A — Single label**  
- All paid content: "Featured" (neutral, no sponsor name)

**Option B — Type-specific labels**  
- "Sponsored" for paid ads
- "Partner Spotlight" for partnerships
- "Featured" for editorial/admin picks

**Option C — Always show sponsor name when available**  
- "Sponsored by [Name]" or "Partner: [Name]"
- More transparent, may feel more commercial

**Your choice:** [ ] A  [ ] B  [ ] C

---

### 7. Admin UI Scope

**Option A — Minimal (MVP)**  
- Add "Featured" toggle + `featuredUntil` + `sponsorName` to existing event edit form
- No dedicated promotions management page

**Option B — Dedicated admin page**  
- New `/admin/promotions` or `/admin/featured` page
- List, create, edit, reorder featured items
- Supports Option B data model (Promotion table)

**Option C — Under Content**  
- Add "Featured Events" section to existing `/admin/content` page
- Simpler than full promotions page, but still structured

**Your choice:** [ ] A  [ ] B  [ ] C

---

### 8. Events Page — Plan in Advance Filter

- Add "Plan in Advance" as a new `DATE_FILTERS` option so `/events?dateRange=plan_ahead` works?
- Suggested: Yes, for consistency

**Your choice:** [ ] Yes  [ ] No

---

## Implementation Phases (Once Choices Are Made)

### Phase 1: Schema + Data
- [ ] Add schema (Event fields or Promotion model per choice 1)
- [ ] Create and run migration
- [ ] Seed or manual test data if needed

### Phase 2: Home Page — Plan in Advance
- [ ] Add `getPlanAheadRange()` helper (per choice 2)
- [ ] Fetch plan-ahead events in `page.tsx`
- [ ] Add "Plan in Advance" section (between This Weekend and Newsletter)
- [ ] Add "View all" link to `/events?dateRange=plan_ahead` (if choice 8 = Yes)

### Phase 3: Home Page — Featured Section
- [ ] Fetch featured/promoted content (per choice 1)
- [ ] Add Featured section (between Hero and This Weekend)
- [ ] Create `FeaturedEventCard` or extend `EventCard` with badge (per choices 3, 6)
- [ ] Implement display style (grid / carousel / hero per choice 3)

### Phase 4: Admin UI
- [ ] Implement admin flow per choice 7
- [ ] Wire up featured/promotion CRUD

### Phase 5: Events Page Filter (if choice 8 = Yes)
- [ ] Add `plan_ahead` to `DATE_FILTERS` in `constants.ts`
- [ ] Add `plan_ahead` case in `getDateRange()` on events page

### Phase 6: Tests + Polish
- [ ] Unit tests for date range helpers
- [ ] Integration test for home page sections
- [ ] Update docs (ROUTES.md, etc.)

---

## Files to Create/Modify (Preliminary)

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add Event fields or Promotion model |
| `src/app/page.tsx` | Add Featured + Plan in Advance sections |
| `src/components/event-card.tsx` | Optional: `showBadge` prop for "Featured"/"Sponsored" |
| `src/components/featured-event-card.tsx` | New (if different styling) |
| `src/lib/date-ranges.ts` | New: shared `getPlanAheadRange()` |
| `src/lib/constants.ts` | Add `plan_ahead` to DATE_FILTERS (if applicable) |
| `src/app/events/page.tsx` | Add `plan_ahead` case in `getDateRange()` |
| `src/app/admin/content/page.tsx` or new page | Admin UI for featured/promotions |
| `src/app/api/admin/promotions/route.ts` | New (if Promotion model) |
| `docs/ROUTES.md` | Update home page description |

---

## Next Step

**Please fill in your choices for items 1–8 above.** Once you respond, this plan will be updated and implementation can begin.
