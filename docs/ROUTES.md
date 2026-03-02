# Spokane Markets — Route Reference

This document catalogs all 60 routes and their accessibility via navigation.

---

## Route Summary


| Type                | Count  |
| ------------------- | ------ |
| Public pages        | 14     |
| Auth pages          | 3      |
| Role-specific pages | 12     |
| Admin pages         | 14     |
| API routes          | 17     |
| **Total**           | **60** |


---

## Public Pages (14)


| Route                   | Purpose                                                       | Nav          | Footer        | Other Access                           |
| ----------------------- | ------------------------------------------------------------- | ------------ | ------------- | -------------------------------------- |
| `/`                     | Homepage — hero, this weekend events, newsletter signup       | Logo         | Logo          | —                                      |
| `/events`               | Event listing with filters, saved filters, save-filter dialog | ✅ Main nav   | —             | Homepage CTA                           |
| `/events/[slug]`        | Event detail — attendance toggle, reviews, directions         | —            | —             | Event cards, links                     |
| `/markets`              | Market directory                                              | ✅ Main nav   | —             | —                                      |
| `/markets/[slug]`       | Market detail — upcoming events, claim button, reviews        | —            | —             | Market cards                           |
| `/markets/[slug]/claim` | Claim market form (auth required)                             | —            | —             | "Claim This Market" on market page     |
| `/vendors`              | Vendor directory                                              | ✅ Main nav   | —             | —                                      |
| `/vendors/[slug]`       | Vendor profile + "Where We'll Be Next"                        | —            | —             | Vendor cards                           |
| `/submit`               | Public event submission form                                  | ✅ Main nav   | ✅ Quick Links | —                                      |
| `/vendor-survey`        | Vendor pain-point survey                                      | ✅ Main nav   | ✅ Quick Links | —                                      |
| `/newsletter`           | Newsletter signup with area preferences                       | —            | —             | Footer form posts to `/api/newsletter` |
| `/auth/signin`          | Sign in                                                       | Auth buttons | —             | Protected route redirect               |
| `/auth/signup`          | Sign up                                                       | Auth buttons | —             | Sign-in page link                      |
| `/unauthorized`         | Access denied message                                         | —            | —             | RBAC redirect                          |


---

## Role-Specific Pages (12)

### Vendor (VENDOR role)


| Route                  | Purpose                                      | Access                                           |
| ---------------------- | -------------------------------------------- | ------------------------------------------------ |
| `/vendor/dashboard`    | Vendor home — profile summary, linked events | **No nav link** — must know URL or be redirected |
| `/vendor/profile/edit` | Create/edit vendor profile                   | Link from dashboard                              |
| `/vendor/events/link`  | Link vendor to upcoming events               | Link from dashboard                              |


### Organizer (ORGANIZER role)


| Route                         | Purpose                                    | Access                          |
| ----------------------------- | ------------------------------------------ | ------------------------------- |
| `/organizer/dashboard`        | Organizer home — markets, submitted events | **No nav link** — must know URL |
| `/organizer/events/new`       | Submit new event                           | Link from organizer dashboard   |
| `/organizer/events/[id]/edit` | Edit submitted event                       | Link from organizer dashboard   |


### Authenticated User (any role)


| Route               | Purpose              | Access                          |
| ------------------- | -------------------- | ------------------------------- |
| `/settings/filters` | Manage saved filters | **No nav link** — must know URL |


### Admin (ADMIN role)


| Route                      | Purpose                                  | Access                          |
| -------------------------- | ---------------------------------------- | ------------------------------- |
| `/admin`                   | Admin dashboard — stats, recent activity | **No nav link** — must know URL |
| `/admin/events`            | Event management                         | Admin sidebar                   |
| `/admin/events/new`        | Create event                             | Admin events page               |
| `/admin/events/[id]/edit`  | Edit event                               | Admin events page               |
| `/admin/markets`           | Market management                        | Admin sidebar                   |
| `/admin/markets/new`       | Create market                            | Admin markets page              |
| `/admin/markets/[id]/edit` | Edit market                              | Admin markets page              |
| `/admin/venues`            | Venue management                         | Admin sidebar                   |
| `/admin/venues/new`        | Create venue                             | Admin venues page               |
| `/admin/venues/[id]/edit`  | Edit venue                               | Admin venues page               |
| `/admin/submissions`       | Submission queue                         | Admin sidebar                   |
| `/admin/reviews`           | Review moderation                        | Admin sidebar                   |
| `/admin/claims`            | Market claim requests                    | Admin sidebar                   |
| `/admin/subscribers`       | Subscriber list                          | Admin sidebar                   |
| `/admin/banners`           | Configure page banner images             | Admin sidebar                   |
| `/admin/landing`           | Toggle/config landing page (Coming Soon, Maintenance) | Admin sidebar |


---

## Landing Page (Configurable)

When enabled in Admin → Landing Page, visitors see a configurable landing page instead of the main site. Use for "Coming Soon" or "Down for Maintenance". Admins can always access `/admin` to toggle off or edit header/text. Routes `/admin`, `/api`, `/auth`, and `/landing` always bypass the landing page.

**Required:** Set `NEXT_PUBLIC_APP_URL` in `.env.local` (e.g. `https://spokane.markets` or `http://localhost:3000`). The middleware uses this to fetch the landing config when behind a reverse proxy. Test in incognito or a different browser—visit `/` to see the landing page.


---

## API Routes (17)


| Method          | Route                           | Purpose                                                            | Auth                  |
| --------------- | ------------------------------- | ------------------------------------------------------------------ | --------------------- |
| GET/POST        | `/api/auth/[...nextauth]`       | NextAuth handlers                                                  | —                     |
| POST            | `/api/auth/register`            | User registration                                                  | Public                |
| POST            | `/api/submissions`              | Public event submission                                            | Public (rate-limited) |
| POST            | `/api/subscribe`                | Newsletter subscription                                            | Public                |
| POST            | `/api/newsletter`               | Newsletter subscription (alias)                                    | Public                |
| POST            | `/api/vendor-survey`            | Vendor survey response                                             | Public                |
| POST            | `/api/events/[slug]/attendance` | Toggle Going/Interested                                            | User                  |
| POST            | `/api/reviews`                  | Create review                                                      | User                  |
| POST            | `/api/photos/upload`            | Upload photo                                                       | User                  |
| POST            | `/api/markets/claim`            | Submit market claim                                                | User                  |
| GET/POST/PUT    | `/api/vendor/profile`           | Vendor profile CRUD                                                | Vendor                |
| GET/POST/DELETE | `/api/vendor/events`            | Link/unlink vendor to events                                       | Vendor                |
| POST            | `/api/organizer/events`         | Create event                                                       | Organizer             |
| PUT/DELETE      | `/api/organizer/events/[id]`    | Update/delete event                                                | Organizer             |
| GET/POST        | `/api/filters`                  | Saved filters                                                      | User                  |
| PUT/DELETE      | `/api/filters/[id]`             | Update/delete filter                                               | User                  |
| *               | `/api/admin/`*                  | Admin CRUD (events, markets, venues, submissions, reviews, claims) | Admin                 |


---

## Footer Links


| Link            | Target           | Status                             |
| --------------- | ---------------- | ---------------------------------- |
| About & Contact | `/about`         | Combined page                      |
| Submit Event    | `/submit`        | ✓                                  |
| Vendor Survey   | `/vendor-survey` | ✓                                  |
| Admin           | `/admin`         | Shown only when user role is ADMIN |


---

## Navigation Gaps

### Main navbar (public)

**Currently linked:** Events, Markets, Vendors, Submit Event, Vendor Survey

**Not linked:**

- `/newsletter` — Dedicated newsletter page (footer has inline form instead)

### Logged-in user menu

**Currently:** User name + role badge + Sign Out only.

**Missing:**

- Link to `/vendor/dashboard` when role is VENDOR
- Link to `/organizer/dashboard` when role is ORGANIZER
- Link to `/admin` when role is ADMIN
- Link to `/settings/filters` for saved filters (any authenticated user)

### Admin area

**Access:** No link from main site. Users must navigate to `/admin` directly.

**Suggestion:** Add "Admin" link in navbar when `session.user.role === "ADMIN"`.

---

## Recommended Additions

1. **User dropdown menu** (when logged in): Add a dropdown or expandable section with:
  - Vendor Dashboard (if VENDOR)
  - Organizer Dashboard (if ORGANIZER)
  - Admin (if ADMIN)
  - Saved Filters → `/settings/filters`
  - Sign Out
2. **Create placeholder pages** for footer links:
  - `/about` — About Spokane Markets
  - `/contact` — Contact form or info
3. ~~**Admin entry point**~~: Admin link now appears in footer for ADMIN users and in user dropdown.

---

## Market Verification Workflow

Markets can be verified in two ways:

1. **Claim workflow**: A user submits a claim at `/markets/[slug]/claim`. Admin approves at `/admin/claims` → market gets `VERIFIED` and `ownerId` set to the claimer.
2. **Manual verification**: Admin can:
  - Click **Verify** on the markets list (`/admin/markets`) for any unverified market
  - Edit a market (`/admin/markets/[id]/edit`) and set **Verification Status** (UNVERIFIED / PENDING / VERIFIED) and optionally assign an **Owner**

