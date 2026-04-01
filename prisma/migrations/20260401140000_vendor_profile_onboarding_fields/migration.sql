-- AlterTable
ALTER TABLE "vendor_profiles" ADD COLUMN "heroImageUrl" TEXT,
ADD COLUMN "heroImageFocalX" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "heroImageFocalY" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "primaryCategory" TEXT,
ADD COLUMN "serviceAreaLabel" TEXT;

-- AlterTable: privacy defaults for new rows (existing rows keep current values)
ALTER TABLE "vendor_profiles" ALTER COLUMN "contactVisible" SET DEFAULT false;
ALTER TABLE "vendor_profiles" ALTER COLUMN "socialLinksVisible" SET DEFAULT false;
