# Admin Dashboard Audit — Spokane Markets

**Date:** March 2025  
**Scope:** Admin console routes, IA, features, security, UX

---

## 1. Current State Summary

### 1.1 Route Map (Tree)

```
/admin                    → Dashboard (stats, recent submissions/reviews)
/admin/analytics          → Analytics (KPIs, users by role, pending, recent signups)
/admin/banners            → Banner image config (hero, markets, events, etc.)
/admin/landing            → Landing page toggle (Coming Soon / Maintenance)
/admin/users              → User list (CRUD, role, reset password, delete)
/admin/users/new          → Create user
/admin/events             → Event list (status tabs, edit, delete)
/admin/events/new         → Create event
/admin/events/[id]/edit   → Edit event
/admin/markets            → Market list (verify, edit, delete)
/admin/markets/new        → Create market
/admin/markets/[id]/edit  → Edit market
/admin/venues             → Venue list
/admin/venues/new         → Create venue
/admin/venues/[id]/edit   → Edit venue
/admin/submissions        → Submission queue (approve/reject)
/admin/reviews            → Review moderation (approve/reject)
/admin/photos             → Photo moderation (approve/reject)
/admin/claims             → Market + Vendor claim requests (approve/reject)
/admin/reports            → User reports (resolve/dismiss)
/admin/subscribers        → Newsletter subscribers
```

**Note:** `/vendor/dashboard` and `/organizer/dashboard` are role-specific dashboards, not admin. They are separate.

### 1.2 Duplicate Feature Map

| Metric / Section        | /admin (Dashboard) | /admin/analytics |
|-------------------------|--------------------|------------------|
| Total events            | ✓                  | ✓ (total + published) |
| Pending submissions     | ✓                  | ✓                |
| Pending claims          | ✓ (market only)    | ✓                |
| Total subscribers       | ✓                  | ✓                |
| Recent submissions      | ✓                  | —                |
| Recent reviews          | ✓                  | —                |
| Recent users            | —                  | ✓                |
| Users by role           | —                  | ✓                |
| Markets, vendors, venues | —               | ✓                |
| Reviews, favorites     | —                  | ✓                |

**Verdict:** Dashboard is operational (queues, recent activity). Analytics is KPI/metrics. Overlap: pending counts and subscribers. Naming is confusing—both are "dashboards" in spirit.

### 1.3 Top Risks

| Risk | Evidence | Severity |
|------|----------|----------|
| **Unbounded queries** | Events, markets, users, submissions, reviews, photos, claims—no pagination. `findMany()` with no `take`. | High at scale |
| **No audit log** | No `AuditLog` model. Admin actions (delete, approve, role change) leave no trace. | High (compliance) |
| **Single admin role** | Only `ADMIN`. No moderator/read-only. All-or-nothing access. | Medium |
| **No vendor management** | No `/admin/vendors`. Vendor profiles managed indirectly via claims; no list/edit vendor profiles. | Medium |
| **Admin protection is per-page** | `requireAdmin()` in layout + each page. Middleware does not block `/admin` for non-admins. | Low (works but no early reject) |
| **Landing config requires NEXT_PUBLIC_APP_URL** | Middleware fetches `${NEXT_PUBLIC_APP_URL}/api/site-config/landing`. If unset or wrong, landing toggle may not work. | Medium (ops) |

---

## 2. Recommended Admin IA (Target)

### 2.1 Proposed Canonical Structure

```
/admin                     → Overview (consolidated: KPIs + operational queues)
/admin/markets             → Markets CRUD
/admin/events              → Events CRUD
/admin/venues              → Venues CRUD
/admin/vendors             → Vendor profiles (NEW: list, view, suspend)
/admin/users               → Users CRUD
/admin/submissions         → Submission queue
/admin/reviews             → Review moderation
/admin/photos              → Photo moderation
/admin/claims              → Market + Vendor claims
/admin/reports             → User reports (flag queue)
/admin/subscribers         → Subscribers
/admin/content             → Banners + Landing (merge Banners + Landing into one)
/admin/settings            → (Future) System settings
/admin/audit-log           → (Future) Audit log viewer
```

### 2.2 Routes to Redirect / Remove / Rename

| Current | Action | Reason |
|---------|--------|--------|
| `/admin/analytics` | **Merge** into `/admin` | Eliminate duplicate; make Overview the single entry |
| `/admin/banners` | **Merge** into `/admin/content` | Group content config |
| `/admin/landing` | **Merge** into `/admin/content` | Same |
| `/admin` | **Keep** (expand) | Add Analytics KPIs + missing queues (reports, photos, vendor claims) |

---

## 3. Feature Gap Matrix

| Area | Feature | Status | Evidence | Recommendation |
|------|---------|--------|----------|----------------|
| **Overview** | Pending reports count | Partial | Dashboard has pending claims/submissions/reviews; reports not shown | Add pending reports, pending photos, pending vendor claims to dashboard |
| **Overview** | KPIs vs ops split | Redundant | Dashboard + Analytics overlap | Merge into one Overview; tabs or sections: "Queues" vs "Metrics" |
| **Users** | Suspend/ban | Missing | No suspend; only delete | Add `suspendedAt` or `status`; soft disable before delete |
| **Users** | Search/filter | Partial | `UserSearchInput` exists for create; list has no search | Add search + role filter to users list |
| **Vendors** | Admin vendor list | Missing | No `/admin/vendors` | Add vendor list; link to profile; optional suspend |
| **Moderation** | Bulk actions | Missing | Approve/reject one-by-one | Add "Approve all" / bulk select (P2) |
| **Moderation** | Report → content link | Partial | Reports show targetType/targetId; link built from slug | Already links to event/market/vendor; review has no public link |
| **Content** | Banners + Landing | Partial | Separate pages | Merge into `/admin/content` with tabs |
| **Audit** | Audit log | Missing | No model, no UI | Add `AuditLog` model; log critical actions (P1) |
| **System** | Health/jobs status | Missing | `/api/health` exists (from audit plan); no admin UI | Add `/admin/system` or link to health in Overview |
| **Communications** | Broadcast email | Missing | No admin UI to send broadcast | P2: segment by role/subscriber, send digest manually |
| **Data** | CSV export | Missing | No export for subscribers, users, events | P2: add export buttons |
| **RBAC** | Moderator role | Missing | Only ADMIN | P2: add MODERATOR with limited scope |
| **Pagination** | All list pages | Missing | Unbounded `findMany` | Add pagination (page, limit) to all admin lists |

---

## 4. Consolidation Plan (Actionable)

### Keep

- `/admin` (expand)
- `/admin/users`, `/admin/users/new`
- `/admin/events`, `/admin/events/new`, `/admin/events/[id]/edit`
- `/admin/markets`, `/admin/markets/new`, `/admin/markets/[id]/edit`
- `/admin/venues`, `/admin/venues/new`, `/admin/venues/[id]/edit`
- `/admin/submissions`, `/admin/reviews`, `/admin/photos`, `/admin/claims`, `/admin/reports`, `/admin/subscribers`

### Merge

- **Analytics → Dashboard:** Move Analytics content into `/admin` (Overview). Add sections: Queues (pending submissions, reviews, photos, claims, reports) + Metrics (users, events, markets, vendors, subscribers, favorites). Delete `/admin/analytics` and remove nav item.
- **Banners + Landing → Content:** Create `/admin/content` with two sections/tabs: "Banners" and "Landing Page". Delete `/admin/banners` and `/admin/landing`. Update nav to single "Content" item.

### Add

- `/admin/vendors` — List vendor profiles; link to public profile; optional suspend.
- Pagination on all list pages (events, markets, venues, users, submissions, reviews, photos, claims, reports, subscribers).

### Rename

- Nav: "Dashboard" → "Overview" (clearer).
- "Reports" (flag queue) is fine; avoid confusion with "Analytics/Reports" by keeping "Reports" = user reports, "Overview" = metrics.

---

## 5. Minimal PR Sequence (6 PRs)

| PR | Goal | Scope | Risk |
|----|------|-------|------|
| **PR-1** | Merge Analytics into Dashboard | Add Analytics KPIs + missing queues (reports, photos, vendor claims) to `/admin`. Remove `/admin/analytics` and nav item. | Low |
| **PR-2** | Merge Banners + Landing into Content | Create `/admin/content` with Banners + Landing sections. Redirect old routes. | Low |
| **PR-3** | Add pagination to admin lists | Add `?page=&limit=` to events, markets, venues, users, submissions, reviews, photos, claims, reports, subscribers. Default limit 25. | Low |
| **PR-4** | Add /admin/vendors | New page: vendor list (businessName, slug, specialties, event count). Link to `/vendors/[slug]`. | Low |
| **PR-5** | Add AuditLog model + logging | Create `AuditLog`; log delete, approve/reject, role change. Add `/admin/audit-log` (P2 or later). | Medium |
| **PR-6** | Add user search + role filter | Search by name/email; filter by role on users page. | Low |

---

## 6. Admin MVP Feature Set (P0)

- **Overview:** Single entry with queues (submissions, reviews, photos, claims, reports) + core metrics (users, events, markets, vendors, subscribers).
- **Content:** Banners + Landing in one place.
- **Moderation:** Submissions, reviews, photos, claims, reports—all with approve/reject.
- **CRUD:** Events, markets, venues, users.
- **Protection:** `requireAdmin()` on layout and all pages; ADMIN-only.
- **Landing:** Toggle + config; `NEXT_PUBLIC_APP_URL` documented.

---

## 7. Admin Next Set (P1)

- Pagination on all lists.
- `/admin/vendors` — vendor profile list.
- Audit log (model + log critical actions; viewer optional).
- User search + role filter.
- System/health link in Overview (or `/admin/system`).

---

## 8. UX/UI Fixes

| Issue | Location | Fix |
|-------|----------|-----|
| **Nav order** | admin-sidebar | Group: Overview, Content → Users, Events, Markets, Venues, Vendors → Submissions, Reviews, Photos, Claims, Reports → Subscribers |
| **Empty states** | All list pages | Consistent "No X found" + CTA where applicable |
| **Loading states** | Server actions | StatusButton/DeleteButton show "..." / "Deleting..."; good. Add skeleton for initial load (optional) |
| **Tables** | events, markets, users, etc. | Responsive: consider card layout on mobile; or horizontal scroll |
| **Breadcrumbs** | Edit pages | Add breadcrumb: Admin > Events > Edit "Event Name" |
| **Confirmations** | Delete | Already use Dialog (theme-friendly). No `confirm()`. ✓ |
| **Accessibility** | Nav, tables | Ensure aria-labels, keyboard nav. Skip link in main layout. |

---

## 9. Security & Permissions (Admin-Specific)

| Check | Status | Notes |
|-------|--------|-------|
| Layout gate | ✓ | `requireAdmin()` in `admin/layout.tsx` |
| Per-page gate | ✓ | Each page calls `requireAdmin()` (redundant with layout but defense-in-depth) |
| Server actions | ✓ | `requireAdminAction()` in `admin/actions.ts` |
| API routes | ✓ | `/api/admin/*` check `session.user.role === "ADMIN"` |
| Middleware | ✗ | Middleware does not protect `/admin`; relies on layout. Anonymous hit to `/admin` gets redirect from `requireAdmin` after auth check. |
| CSRF | ✓ | Server actions and API use Next.js defaults |
| Rate limiting | ✗ | No rate limit on admin mutations. Low risk (admin only) but consider for sensitive actions. |
| Input validation | Partial | Admin forms use zod; some API routes may lack validation. |

**Recommendation:** Add middleware matcher for `/admin` to redirect unauthenticated users to sign-in. Optional: rate limit admin delete/role-change.

---

## 10. Appendix: Admin API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/site-config/landing` | GET, PATCH | Landing config (admin) |
| `/api/admin/site-config` | GET | General site config |
| `/api/admin/users` | GET, POST | List, create user |
| `/api/admin/users/[id]` | GET, PUT, DELETE | User CRUD |
| `/api/admin/users/search` | GET | User search |
| `/api/admin/events` | GET, POST | Events |
| `/api/admin/events/[id]` | GET, PUT, DELETE | Event CRUD |
| `/api/admin/markets` | GET, POST | Markets |
| `/api/admin/markets/[id]` | GET, PUT, DELETE | Market CRUD |
| `/api/admin/venues` | GET, POST | Venues |
| `/api/admin/venues/[id]` | GET, PUT, DELETE | Venue CRUD |
| `/api/admin/subscribers` | GET, POST | Subscribers |
| `/api/admin/subscribers/[id]` | DELETE | Delete subscriber |
| `/api/admin/claims/[id]` | — | (Claim actions via server actions) |
| `/api/admin/submissions/[id]` | — | (Via server actions) |
| `/api/admin/reviews/[id]` | — | (Via server actions) |

**Mutations:** Most admin mutations use server actions (`admin/actions.ts`), not API routes. API routes used for: user CRUD, site config, subscribers.
