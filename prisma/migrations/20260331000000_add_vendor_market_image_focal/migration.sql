-- AlterTable
ALTER TABLE "markets" ADD COLUMN     "imageFocalX" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "markets" ADD COLUMN     "imageFocalY" INTEGER NOT NULL DEFAULT 50;

-- AlterTable
ALTER TABLE "vendor_profiles" ADD COLUMN     "imageFocalX" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "vendor_profiles" ADD COLUMN     "imageFocalY" INTEGER NOT NULL DEFAULT 50;
