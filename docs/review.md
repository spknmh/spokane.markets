Overall: **clean, calm, and readable.** The grid, whitespace, and “queues + metrics” split is the right starting point for an admin home.

That said, it *does* feel a bit “thrown together” for two reasons: **navigation taxonomy** and **what the Overview prioritizes.**

## Layout feedback

### What’s working

* **Queues first** is correct. Admins live in “what needs attention.”
* Cards are consistent and scannable.
* Warm palette fits your brand and doesn’t scream “enterprise admin.”

### What’s holding it back

* **Top nav (public site nav) + left admin nav** creates mixed context. In an admin console, you generally want a dedicated “admin shell” so users don’t feel like they’re half in the public site.
* The overview is missing **clear “actions”**. Right now it’s informational. Admin dashboards should be *operational*.

## Left nav: too much?

It’s not “too much” because you have real entities, but it’s **not grouped well**, so it *feels* heavy.

Right now you have:

* Overview
* Content
* Users
* Events
* Markets
* Venues
* Vendors
* Submissions
* Reviews
* Photos
* Claims
* Reports
* Subscribers
* Audit Log

This is a classic symptom of “one link per table.” Works early, but it doesn’t scale.

### Better structure (what I’d do)

Use **4–6 top-level buckets**, collapsible, and keep only the *workflows* in the main nav:

1. **Operations**

* Overview
* Queues (Submissions, Claims, Reports, Photo Moderation, Pending Reviews)

2. **Content**

* Events
* Markets
* Venues
* Vendors

3. **Users**

* Users
* Roles & Access (if you add groups/permissions)

4. **Comms**

* Subscribers
* Notifications (broadcast + digests + templates)

5. **Reports**

* Analytics (traffic, funnels, growth)
* Operational Reports (top markets, inactive vendors, etc.)

6. **System**

* Audit Log
* Settings (maintenance mode, feature flags, etc.)
* Health / Jobs (optional but valuable)

That instantly reduces cognitive load without removing anything.

## What’s missing on the Overview

If you want this to feel like a “real admin,” add:

### 1) Quick actions (top-right of Overview)

* **Create Event**
* **Create Market**
* **Invite Organizer**
* **Send Announcement**
* **Toggle Maintenance Mode** (if enabled)

### 2) “Needs attention” should be clickable and prioritized

Your queue cards need:

* **click-through** to the filtered list
* ideally: **oldest item age** (“Oldest pending: 6d”) so admins feel urgency
* optionally: **SLA status** (green/yellow/red)

### 3) A “Recent activity” feed

This is huge for admin confidence:

* “Hunter approved vendor claim…”
* “Event updated…”
* “Photo rejected…”
  This can be powered by your audit log.

### 4) A couple of “health” indicators

Minimal but high value:

* Email sending status (last send ok?)
* Job/cron last run (digest/alerts)
* Upload storage usage (optional)

## Duplicate pages (/dashboard vs /analytics)

Be decisive:

* **Overview** = operational queues + a few core totals + activity feed
* **Reports/Analytics** = charts, trends, funnels, cohorts, date ranges

If “analytics” is half-baked, don’t keep two homes. Pick one canonical path:

* `/admin` (Overview)
* `/admin/reports` (Analytics)

…and redirect old routes.

## One blunt design opinion

You should **hide the public site navigation when inside admin** and replace it with:

* Admin breadcrumb/title
* Global admin search (search vendor/event/market by name)
* Profile dropdown + “View site” button

It will instantly feel more professional and reduce misclicks.

If you want, I’ll rewrite your nav into a proposed route map (exact URLs) and a short Cursor prompt to implement the regrouped sidebar + “Overview as ops console” with quick actions and an activity feed.

You’re **90% of the way to a legitimately good admin console**. The visual style is cohesive, the tables are readable, and the forms are clean. What’s missing isn’t “design talent” — it’s **admin information architecture, operational workflows, and a few standard admin UX patterns**.

Here are my blunt opinions and overhaul ideas, page by page + system-wide.

---

## System-wide admin UX issues

### 1) “Content” is doing too much (wrong bucket)

Right now **Content = banner images + landing config + maintenance mode**. That’s not “content” — that’s **Site Settings / System**.

**Fix:** Rename and restructure:

* **Site**

  * Branding (banner images)
  * Landing page config
  * Announcements (optional)
* **System**

  * Maintenance Mode
  * Feature Flags (future)
  * Health / Jobs (future)
  * Audit Log

Maintenance mode under “Content” will confuse every future admin (including you).

### 2) Missing a consistent “Admin shell” pattern

Your admin pages are good individually, but they lack the “admin console feel”:

* no breadcrumbs
* no “View public page” shortcuts
* no “last updated” metadata
* no consistent right-side actions bar / bulk actions / filters

**Fix:** add a standard page header component:

* Title + short description
* Left: tabs/filters
* Right: primary action + secondary actions (Export, View, Duplicate)
* Optional: “Last updated” + “Updated by”

### 3) Everything is single-entity CRUD; admins need workflows

Admins don’t think “edit event field.” They think:

* approve submission
* verify market
* handle claim
* moderate photo
* resolve report

You *already* have queue cards on Overview. The rest of admin should follow that model: **work queues + detail review screens**.

---

## Page-by-page feedback

## Content: Banner Images

**What’s good**

* Visual preview + upload is straightforward.
* The layout is clean and modern.

**What to improve**

* Add: **recommended dimensions** + crop guidance (or enforce aspect ratio).
* Add: **where used** (“Home hero”, “Markets page hero”) with links to preview those pages.
* Add: **draft vs live** toggle (even simple “Save and Publish”) so you don’t accidentally break the public site.
* The “paste image URL” field is fine, but: add a “Test/Preview” button and validate the URL is an image.

**Word choice**

* “Banner Images” → “Page Banners”
* “Homepage hero” → “Home Hero”
* “Markets page” → “Markets Page Hero”

---

## Maintenance Mode page

**What’s good**

* The mode options and messaging fields are clear.
* UX is simple, which is exactly what you want for a dangerous control.

**What’s missing**

* **A prominent status indicator** at the top: “LIVE: Maintenance enabled (Admins only)” with a red/yellow badge.
* **Preview maintenance page** button.
* **Safe-guard confirmation** when enabling:

  * “Type ENABLE to confirm” (for admin-only mode), because locking yourself out is a real risk.
* Show **last changed by + timestamp**.
* Add “Allowlist routes” note (auth routes, /api/health, static assets). This prevents future regressions.

**Word choice**

* “Maintenance — Admins only” is fine.
* Consider: “Maintenance (Admins only)” and “Maintenance (Privileged access)”
* Replace “Config: Set NEXT_PUBLIC_APP_URL…” with a collapsible “Advanced config” callout. It’s too implementation-y for the main UI.

**Most important structural fix**
Move it to: **System → Maintenance**.

---

## Users page

**What’s good**

* Search + role dropdown is the right baseline.
* Role editing inline is convenient.

**What’s risky**
Inline role editing with no context can cause mistakes.

**Must-add admin standards**

* **Role change confirmation** + “why” note (optional)
* **Audit log link** per user (click user → profile drawer)
* **Disable/suspend user** (not delete first)
* **Impersonate / view-as** (later, but extremely useful for support)
* **User detail page/drawer**:

  * roles
  * verified vendor/organizer associations
  * claims
  * submissions count
  * last login
  * last activity
  * email preferences / unsubscribe state

**Word choice**

* “Create user” is unusual in modern auth apps.

  * Better: **“Invite user”** (sends email) or remove entirely unless you have a reason.
* Column “Markets” is confusing on Users.

  * If it means “markets owned/managed”, label it: **“Markets managed”**.

---

## Events list page

**What’s good**

* Status tabs are correct (Draft/Pending/Published/Cancelled).
* Table columns are reasonable.

**What’s missing**

* **Filters**: date range, market, neighborhood, tag, featured.
* **Bulk actions**: Publish, Unpublish, Cancel, Delete (with confirmations)
* **Duplicate event**: a “Clone” action saves time.
* **View public page**: icon/link per row.
* **Sort**: by date (default), recently updated, created.

**UX polish**

* Put **Status badge** closer to title (or color the row subtly) so scanning is faster.
* Make row clickable → detail view (edit is not always the first action an admin wants).

---

## Edit Event page

This is solid, but it’s missing “ops-grade” improvements.

**Must-add**

* **Preview public page** button
* **Publish/Unpublish** as a primary action separate from “Update”
* **Autosave draft** or “unsaved changes” guard
* **Validation**: end date after start, timezone consistency, required fields by status (published must have venue, start/end, title)
* **Image URL** should be an image picker/upload with preview, not raw URL (unless you’re using it intentionally as a fallback)

**Data model / real-world gaps**

* Recurrence is not here (fine for MVP), but you should support at least:

  * “Occurs weekly until…” or “multi-date occurrences”
* “Timezone optional” is dangerous; events need an explicit timezone. Default to America/Los_Angeles (or Spokane’s timezone) and allow override.

**Word choice**

* “Use browser/server time” → “Use site timezone (America/Los_Angeles)” (clearer)
* “Website URL / Facebook URL” good. Consider adding “Instagram” if events have it.

---

## Markets list page

**What’s good**

* Verification status is clearly displayed.
* Events count column is helpful.

**Missing**

* Filters: verified/unverified, owner assigned/unassigned, area.
* Bulk verify/unverify.
* “Owner” should be a clickable user link or “Assign owner” action.
* Add “View public market page” per row.

**Word choice**

* “Owner” might be better as **“Organizer”** or **“Managed by”** to match your product language.

---

## Edit Market page

This is close to great.

**Missing**

* **Market logo / banner** (separate from global banners)
* **Operating details**:

  * season dates
  * typical hours
  * parking notes (like venue)
  * “about” / rules
* **Organizer management**:

  * add multiple organizers (not just one “Owner”)
  * roles: owner/admin/editor
* **Verification workflow**:

  * show verification reason / checklist
  * “Verified by” + timestamp
* Add “View market page” button.

**Word choice**

* “Typical Schedule” is good.
* “Base Area” is okay but might be confusing. Consider: **“Neighborhood / Area”**.

---

## Venues list + Edit Venue

**What’s good**

* Venue table is clean and the model is right (lat/long, neighborhood).
* Parking notes are a good touch.

**Missing**

* **Geocoding helper**: “Auto-fill lat/long from address” (admin QoL win).
* **Map preview** on edit page.
* **Normalize address** and store as structured fields; you already have most.
* “Neighborhood” should probably be a controlled taxonomy (or at least consistent labels).

**Word choice**

* “Neighborhood” works. For Spokane specifically, you might consider “Neighborhood / District.”

---

## The biggest “admin operations” features you’re missing

If you want this to feel like a real platform, add these next:

### 1) A dedicated **Queues** area (not just overview cards)

* Pending submissions
* Pending claims (vendor/market)
* Pending reviews
* Pending photos
* Reports

Each queue needs:

* filters
* bulk actions
* review screen
* audit logging

### 2) “Recent Activity” / audit feed on Overview

Powered by audit log, this becomes your admin confidence dashboard.

### 3) Comms tools

* Subscriber management is good.
* Add “Announcements” (site banner / email broadcast)
* Add notification job status (“digest last ran”, “failed sends”)

### 4) Exports

Admins always need:

* CSV export for users/vendors/events/subscribers
* Rate limited and logged

---

## One clean navigation overhaul

If you want the admin to feel less cluttered, regroup nav like this:

**Operations**

* Overview
* Queues

**Directory**

* Events
* Markets
* Venues
* Vendors

**Users**

* Users
* Subscribers

**Moderation**

* Reviews
* Photos
* Reports
* Claims

**System**

* Site Settings (banners, landing)
* Maintenance
* Audit Log

This keeps all your existing pages but makes the console feel intentional.

---

If you want, I can write:

1. a **Cursor prompt** to implement this navigation regroup + admin shell header component, and
2. a **priority list** of 10 “high leverage admin QoL” tickets (filters, bulk actions, previews, geocoding button, audit linkages) that will make this feel production-grade fast.

