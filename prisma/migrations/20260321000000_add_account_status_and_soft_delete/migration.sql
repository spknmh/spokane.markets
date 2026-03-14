-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED');

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "events"
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "markets"
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "venues"
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vendor_profiles"
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "events_deletedAt_idx" ON "events"("deletedAt");

-- CreateIndex
CREATE INDEX "markets_deletedAt_idx" ON "markets"("deletedAt");

-- CreateIndex
CREATE INDEX "venues_deletedAt_idx" ON "venues"("deletedAt");

-- CreateIndex
CREATE INDEX "vendor_profiles_deletedAt_idx" ON "vendor_profiles"("deletedAt");

