-- AlterTable
ALTER TABLE "notification_preferences" ADD COLUMN "vendorRequestAlertsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN "reviewAlertsEnabled" BOOLEAN NOT NULL DEFAULT true;
