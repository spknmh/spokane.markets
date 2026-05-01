-- CreateEnum
CREATE TYPE "BadgeCategory" AS ENUM ('USER_ACHIEVEMENT', 'LISTING_COMMUNITY');

-- AlterTable
ALTER TABLE "badge_definitions"
ADD COLUMN "category" "BadgeCategory" NOT NULL DEFAULT 'USER_ACHIEVEMENT';

-- CreateTable
CREATE TABLE "_MarketListingBadges" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_VendorProfileListingBadges" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_MarketListingBadges_AB_unique" ON "_MarketListingBadges"("A", "B");

-- CreateIndex
CREATE INDEX "_MarketListingBadges_B_index" ON "_MarketListingBadges"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_VendorProfileListingBadges_AB_unique" ON "_VendorProfileListingBadges"("A", "B");

-- CreateIndex
CREATE INDEX "_VendorProfileListingBadges_B_index" ON "_VendorProfileListingBadges"("B");

-- AddForeignKey
ALTER TABLE "_MarketListingBadges"
ADD CONSTRAINT "_MarketListingBadges_A_fkey"
FOREIGN KEY ("A") REFERENCES "badge_definitions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MarketListingBadges"
ADD CONSTRAINT "_MarketListingBadges_B_fkey"
FOREIGN KEY ("B") REFERENCES "markets"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VendorProfileListingBadges"
ADD CONSTRAINT "_VendorProfileListingBadges_A_fkey"
FOREIGN KEY ("A") REFERENCES "badge_definitions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VendorProfileListingBadges"
ADD CONSTRAINT "_VendorProfileListingBadges_B_fkey"
FOREIGN KEY ("B") REFERENCES "vendor_profiles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
