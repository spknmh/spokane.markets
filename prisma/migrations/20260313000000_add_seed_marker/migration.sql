-- Tracks whether sample data (venues, markets, events) has been seeded.
-- Used to make seed idempotent: skip sample data on subsequent runs.
CREATE TABLE IF NOT EXISTS "seed_marker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ran_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
