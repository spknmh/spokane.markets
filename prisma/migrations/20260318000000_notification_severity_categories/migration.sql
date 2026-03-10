-- Add severity, category, actor/object tracking, metadata, and archive/snooze to notifications
ALTER TABLE "notifications" ADD COLUMN "severity" TEXT NOT NULL DEFAULT 'info';
ALTER TABLE "notifications" ADD COLUMN "category" TEXT;
ALTER TABLE "notifications" ADD COLUMN "actorId" TEXT;
ALTER TABLE "notifications" ADD COLUMN "objectId" TEXT;
ALTER TABLE "notifications" ADD COLUMN "objectType" TEXT;
ALTER TABLE "notifications" ADD COLUMN "metadata" JSONB;
ALTER TABLE "notifications" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "notifications" ADD COLUMN "snoozedUntil" TIMESTAMP(3);

-- Indexes for filtering by severity and category
CREATE INDEX "notifications_userId_severity_idx" ON "notifications"("userId", "severity");
CREATE INDEX "notifications_userId_category_idx" ON "notifications"("userId", "category");

-- Add category-level in-app notification controls to preferences
ALTER TABLE "notification_preferences" ADD COLUMN "inAppOperationalEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN "inAppDiscoveryEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN "inAppTrustSafetyEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN "inAppGrowthEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN "inAppSystemEnabled" BOOLEAN NOT NULL DEFAULT true;
