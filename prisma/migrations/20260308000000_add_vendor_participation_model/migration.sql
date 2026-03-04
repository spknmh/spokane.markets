-- CreateEnum
CREATE TYPE "VendorIntentStatus" AS ENUM ('INTERESTED', 'APPLIED', 'REQUESTED', 'ATTENDING', 'WAITLISTED', 'DECLINED', 'WITHDREW');
CREATE TYPE "IntentVisibility" AS ENUM ('PRIVATE', 'PUBLIC');
CREATE TYPE "RosterStatus" AS ENUM ('INVITED', 'ACCEPTED', 'CONFIRMED', 'CANCELLED');
CREATE TYPE "ParticipationMode" AS ENUM ('OPEN', 'REQUEST_TO_JOIN', 'INVITE_ONLY', 'CAPACITY_LIMITED');

-- AlterTable
ALTER TABLE "markets" ADD COLUMN "participationMode" "ParticipationMode" NOT NULL DEFAULT 'OPEN';
ALTER TABLE "markets" ADD COLUMN "vendorCapacity" INTEGER;
ALTER TABLE "markets" ADD COLUMN "publicIntentListEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "markets" ADD COLUMN "publicIntentNamesEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "markets" ADD COLUMN "publicRosterEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "markets" ADD COLUMN "rosterClaimRequired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "events" ADD COLUMN "participationMode" "ParticipationMode";
ALTER TABLE "events" ADD COLUMN "vendorCapacity" INTEGER;
ALTER TABLE "events" ADD COLUMN "publicIntentListEnabled" BOOLEAN;
ALTER TABLE "events" ADD COLUMN "publicIntentNamesEnabled" BOOLEAN;
ALTER TABLE "events" ADD COLUMN "publicRosterEnabled" BOOLEAN;

-- CreateTable
CREATE TABLE "event_vendor_intents" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "status" "VendorIntentStatus" NOT NULL,
    "notes" TEXT,
    "visibility" "IntentVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_vendor_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_vendor_roster" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "status" "RosterStatus" NOT NULL,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_vendor_roster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_vendor_intents_eventId_vendorProfileId_key" ON "event_vendor_intents"("eventId", "vendorProfileId");
CREATE INDEX "event_vendor_intents_eventId_status_idx" ON "event_vendor_intents"("eventId", "status");
CREATE INDEX "event_vendor_intents_vendorProfileId_status_idx" ON "event_vendor_intents"("vendorProfileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "event_vendor_roster_eventId_vendorProfileId_key" ON "event_vendor_roster"("eventId", "vendorProfileId");
CREATE INDEX "event_vendor_roster_eventId_status_idx" ON "event_vendor_roster"("eventId", "status");

-- AddForeignKey
ALTER TABLE "event_vendor_intents" ADD CONSTRAINT "event_vendor_intents_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_vendor_intents" ADD CONSTRAINT "event_vendor_intents_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_vendor_roster" ADD CONSTRAINT "event_vendor_roster_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_vendor_roster" ADD CONSTRAINT "event_vendor_roster_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_vendor_roster" ADD CONSTRAINT "event_vendor_roster_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
