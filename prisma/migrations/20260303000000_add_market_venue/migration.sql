-- AlterTable: Add venueId to markets (nullable first for backfill)
ALTER TABLE "markets" ADD COLUMN "venueId" TEXT;

-- Backfill: Ensure at least one venue exists (for fresh DB with no venues)
INSERT INTO "venues" ("id", "name", "address", "city", "state", "zip", "lat", "lng", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Location TBD', 'TBD', 'TBD', 'TBD', '00000', 0, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "venues" LIMIT 1);

-- Backfill: Use first event's venue, or first venue in DB
UPDATE "markets" m SET "venueId" = (
  SELECT COALESCE(
    (SELECT "venueId" FROM "events" WHERE "marketId" = m.id LIMIT 1),
    (SELECT "id" FROM "venues" LIMIT 1)
  )
) WHERE m."venueId" IS NULL;

-- AddForeignKey
ALTER TABLE "markets" ADD CONSTRAINT "markets_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Make venueId NOT NULL
ALTER TABLE "markets" ALTER COLUMN "venueId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "markets_venueId_idx" ON "markets"("venueId");
