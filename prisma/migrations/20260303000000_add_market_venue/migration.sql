-- AlterTable: Add venue_id to markets (nullable first for backfill)
ALTER TABLE "markets" ADD COLUMN "venue_id" TEXT;

-- CreateIndex (will be used after backfill)
-- CreateIndex "markets_venue_id_idx" ON "markets"("venue_id");

-- Backfill: Ensure at least one venue exists (for fresh DB with no venues)
INSERT INTO "venues" ("id", "name", "address", "city", "state", "zip", "lat", "lng", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Location TBD', 'TBD', 'TBD', 'TBD', '00000', 0, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "venues" LIMIT 1);

-- Backfill: Use first event's venue, or first venue in DB
UPDATE "markets" m SET "venue_id" = (
  SELECT COALESCE(
    (SELECT "venue_id" FROM "events" WHERE "market_id" = m.id LIMIT 1),
    (SELECT "id" FROM "venues" LIMIT 1)
  )
) WHERE m."venue_id" IS NULL;

-- AddForeignKey
ALTER TABLE "markets" ADD CONSTRAINT "markets_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Make venue_id NOT NULL
ALTER TABLE "markets" ALTER COLUMN "venue_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "markets_venue_id_idx" ON "markets"("venue_id");
