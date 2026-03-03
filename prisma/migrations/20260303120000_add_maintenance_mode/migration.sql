-- CreateEnum
CREATE TYPE "MaintenanceMode" AS ENUM ('OFF', 'MAINTENANCE_ADMIN_ONLY', 'MAINTENANCE_PRIVILEGED');

-- CreateTable
CREATE TABLE "site_state" (
    "id" TEXT NOT NULL,
    "mode" "MaintenanceMode" NOT NULL DEFAULT 'OFF',
    "messageTitle" TEXT NOT NULL DEFAULT 'We''ll be right back',
    "messageBody" TEXT,
    "eta" TIMESTAMP(3),
    "updatedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_state_pkey" PRIMARY KEY ("id")
);

-- Insert default row
INSERT INTO "site_state" ("id", "mode", "messageTitle", "updatedAt")
VALUES ('default', 'OFF', 'We''ll be right back', NOW());

-- AddForeignKey
ALTER TABLE "site_state" ADD CONSTRAINT "site_state_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
