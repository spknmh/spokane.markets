-- CreateEnum
CREATE TYPE "ReportSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportEscalationStatus" AS ENUM ('NEW', 'TRIAGED', 'ESCALATED', 'CLOSED');

-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'NEEDS_INFO';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'DUPLICATE';

-- AlterTable
ALTER TABLE "reports"
ADD COLUMN "assigneeUserId" TEXT,
ADD COLUMN "internalNotes" TEXT,
ADD COLUMN "severity" "ReportSeverity" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "escalationStatus" "ReportEscalationStatus" NOT NULL DEFAULT 'NEW';

-- CreateIndex
CREATE INDEX "reports_severity_idx" ON "reports"("severity");

-- CreateIndex
CREATE INDEX "reports_escalationStatus_idx" ON "reports"("escalationStatus");

-- CreateIndex
CREATE INDEX "reports_assigneeUserId_idx" ON "reports"("assigneeUserId");

-- AddForeignKey
ALTER TABLE "reports"
ADD CONSTRAINT "reports_assigneeUserId_fkey"
FOREIGN KEY ("assigneeUserId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

