# Development — Hot Reload

Docker file watching on Windows is unreliable. For **guaranteed hot reload**:

## Option 1: Local dev (recommended)

```bash
# Terminal 1: Start only the database
npm run db:up

# Terminal 2: Run Next.js locally (hot reload works)
npm run dev
```

Changes to code will hot reload immediately.

## Option 2: Full Docker

```bash
npm run dev:docker
```

Uses polling for file changes. If hot reload still doesn't work, use Option 1.
