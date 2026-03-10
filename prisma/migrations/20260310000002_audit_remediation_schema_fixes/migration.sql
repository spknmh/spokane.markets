-- 1. New enums
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');
CREATE TYPE "ReportTargetType" AS ENUM ('EVENT', 'MARKET', 'VENDOR', 'REVIEW');
CREATE TYPE "ContactMessageStatus" AS ENUM ('PENDING', 'READ', 'ARCHIVED');

-- 2. Add APPROVED to VendorIntentStatus enum
ALTER TYPE "VendorIntentStatus" ADD VALUE 'APPROVED';

-- 3. Cascade delete fixes: make userId nullable and switch to SetNull

-- AuditLog: make userId nullable
ALTER TABLE "audit_logs" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_userId_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Report: make userId nullable
ALTER TABLE "reports" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "reports_userId_fkey";
ALTER TABLE "reports" ADD CONSTRAINT "reports_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- VendorProfile: switch onDelete from Cascade to SetNull (userId already nullable)
ALTER TABLE "vendor_profiles" DROP CONSTRAINT IF EXISTS "vendor_profiles_userId_fkey";
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Review: make userId nullable
ALTER TABLE "reviews" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_userId_fkey";
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Convert String fields to enums

-- Report.status: String -> ReportStatus
ALTER TABLE "reports" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "reports" ALTER COLUMN "status" TYPE "ReportStatus" USING "status"::"ReportStatus";
ALTER TABLE "reports" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Report.targetType: String -> ReportTargetType
ALTER TABLE "reports" ALTER COLUMN "targetType" TYPE "ReportTargetType" USING "targetType"::"ReportTargetType";

-- ContactMessage.status: String -> ContactMessageStatus
ALTER TABLE "contact_messages" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "contact_messages" ALTER COLUMN "status" TYPE "ContactMessageStatus" USING "status"::"ContactMessageStatus";
ALTER TABLE "contact_messages" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- 5. Remove dead columns from Event
ALTER TABLE "events" DROP COLUMN IF EXISTS "timezone";
ALTER TABLE "events" DROP COLUMN IF EXISTS "recurrenceGroupId";

-- 6. Venue deduplication: unique constraint on (name, address)
ALTER TABLE "venues" ADD CONSTRAINT "venues_name_address_key" UNIQUE ("name", "address");

-- 7. Add missing foreign key indexes
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId");
CREATE INDEX "reviews_eventId_idx" ON "reviews"("eventId");
CREATE INDEX "reviews_marketId_idx" ON "reviews"("marketId");
CREATE INDEX "photos_uploadedById_idx" ON "photos"("uploadedById");
CREATE INDEX "photos_eventId_idx" ON "photos"("eventId");
CREATE INDEX "photos_marketId_idx" ON "photos"("marketId");
CREATE INDEX "events_marketId_idx" ON "events"("marketId");
CREATE INDEX "events_submittedById_idx" ON "events"("submittedById");
CREATE INDEX "markets_ownerId_idx" ON "markets"("ownerId");
CREATE INDEX "favorite_vendors_vendorProfileId_idx" ON "favorite_vendors"("vendorProfileId");
CREATE INDEX "saved_filters_userId_idx" ON "saved_filters"("userId");

-- 8. Remove redundant slug indexes (already covered by unique constraints)
DROP INDEX IF EXISTS "markets_slug_idx";
DROP INDEX IF EXISTS "events_slug_idx";
DROP INDEX IF EXISTS "vendor_profiles_slug_idx";
