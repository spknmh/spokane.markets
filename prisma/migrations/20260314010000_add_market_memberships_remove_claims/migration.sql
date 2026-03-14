DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MarketMembershipRole') THEN
    CREATE TYPE "MarketMembershipRole" AS ENUM ('OWNER', 'MANAGER', 'VOLUNTEER', 'STAFF');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "market_memberships" (
  "id" TEXT NOT NULL,
  "marketId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "MarketMembershipRole" NOT NULL DEFAULT 'OWNER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "market_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "market_memberships_marketId_userId_key"
  ON "market_memberships"("marketId", "userId");

CREATE INDEX IF NOT EXISTS "market_memberships_userId_role_idx"
  ON "market_memberships"("userId", "role");

INSERT INTO "market_memberships" ("id", "marketId", "userId", "role", "createdAt", "updatedAt")
SELECT
  CONCAT('mm_', "id"),
  "id",
  "ownerId",
  'OWNER'::"MarketMembershipRole",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "markets"
WHERE "ownerId" IS NOT NULL
ON CONFLICT ("marketId", "userId") DO NOTHING;

ALTER TABLE "market_memberships"
  ADD CONSTRAINT "market_memberships_marketId_fkey"
  FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "market_memberships"
  ADD CONSTRAINT "market_memberships_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE IF EXISTS "claim_requests";
DROP TABLE IF EXISTS "vendor_claim_requests";
