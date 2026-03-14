# Spokane Markets

Discover local markets, craft fairs, and vendor events across Spokane.

Spokane Markets is a Next.js application with role-based workflows for admins, organizers, vendors, and shoppers. It includes event discovery, market and venue management, moderation workflows, newsletter/digest tooling, and production deployment via Docker + GitHub Actions.

## Highlights

- Public discovery pages for events, markets, and vendors
- Admin dashboard for CRUD, moderation queues, and site settings
- Organizer and vendor role workflows
- Neighborhood-based filtering and subscription preferences
- Background jobs for digest emails, alerts, and DB backups
- Containerized production deploy with GHCR and SSH rollout

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- PostgreSQL + Prisma
- Better Auth
- Tailwind CSS
- Vitest + ESLint
- Docker Compose + Caddy + GitHub Actions

## Requirements

- Node.js 25+
- npm 10+
- Docker + Docker Compose v2

## Local Setup

1. Install dependencies:

```bash
npm ci
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Start local database:

```bash
npm run db:up
```

4. Apply migrations and seed:

```bash
npx prisma migrate deploy
npx prisma db seed
```

5. Start app:

```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Useful Scripts

- `npm run dev` - start local app
- `npm run build` - production build
- `npm run start` - run production build
- `npm run lint` - run ESLint
- `npm run test` - run unit tests
- `npm run db:up` - start PostgreSQL compose stack
- `npm run db:seed` - seed database

## Deployment

Production deployment guide:

- [`docs/DEPLOY.md`](docs/DEPLOY.md)

Admin and operations guide:

- [`docs/ADMIN-GUIDE.md`](docs/ADMIN-GUIDE.md)

## Documentation

- [`docs/Home.md`](docs/Home.md) - docs index
- [`docs/wiki/`](docs/wiki/) - wiki-ready documentation pages

## Analytics Events

Canonical Umami events for the onboarding/moderation workflows:

- `vendor_profile_edit`
- `vendor_profile_publish`
- `vendor_verification_request_submitted`
- `vendor_verification_request_error`
- `vendor_verification_requirement_unmet`
- `organizer_market_created`
- `organizer_market_create_error`
- `vendor_onboarding_checklist_view`
- `vendor_onboarding_checklist_dismiss`
- `organizer_dashboard_view`
- `vendor_dashboard_view`

## Security

- Never commit real secrets or private keys
- Keep runtime secrets in `.env.local` (ignored by Git) and GitHub Actions secrets
- Use least-privilege tokens for deployment
