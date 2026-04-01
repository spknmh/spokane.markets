-- Organizer onboarding: listing metadata, compliance fields, evidence, moderation notes

-- CreateEnum
CREATE TYPE "ListingKind" AS ENUM ('MARKET_BRAND', 'EVENT_OCCURRENCE', 'BOTH');
CREATE TYPE "OrganizerEventType" AS ENUM ('FARMERS_MARKET', 'CRAFT_FAIR', 'NIGHT_MARKET', 'POP_UP', 'HOLIDAY_MARKET', 'OTHER');
CREATE TYPE "OccurrenceModel" AS ENUM ('ONE_TIME', 'RECURRING', 'SEASONAL_SERIES');
CREATE TYPE "IndoorOutdoorMode" AS ENUM ('INDOOR', 'OUTDOOR', 'HYBRID');
CREATE TYPE "VendorApplicationState" AS ENUM ('NOT_ACCEPTING', 'OPEN', 'WAITLIST', 'CLOSED');
CREATE TYPE "VendorWorkflowMode" AS ENUM ('INTENT_ONLY', 'BOTH');
CREATE TYPE "SpecialEventPermitStatus" AS ENUM ('NOT_APPLICABLE', 'NOT_REQUIRED', 'PENDING', 'APPROVED', 'UNKNOWN');
CREATE TYPE "RestroomAccess" AS ENUM ('YES', 'NO', 'NEARBY', 'UNKNOWN');
CREATE TYPE "PetPolicy" AS ENUM ('ALLOWED', 'RESTRICTED', 'PROHIBITED', 'UNKNOWN');
CREATE TYPE "ListingEvidenceType" AS ENUM ('SPECIAL_EVENT_PERMIT', 'INSURANCE_COI', 'HEALTH_PERMIT', 'NONPROFIT_DETERMINATION', 'OTHER');
CREATE TYPE "ListingEvidenceVisibility" AS ENUM ('ADMIN_ONLY', 'ORGANIZER_AND_ADMIN');
CREATE TYPE "ListingModerationNoteVisibility" AS ENUM ('ADMIN_ONLY', 'ORGANIZER_VISIBLE');

-- AlterTable markets
ALTER TABLE "markets" ADD COLUMN "listingKind" "ListingKind" NOT NULL DEFAULT 'MARKET_BRAND';
ALTER TABLE "markets" ADD COLUMN "organizerDisplayName" TEXT;
ALTER TABLE "markets" ADD COLUMN "organizerPublicContact" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "markets" ADD COLUMN "eventType" "OrganizerEventType";
ALTER TABLE "markets" ADD COLUMN "occurrenceModel" "OccurrenceModel";
ALTER TABLE "markets" ADD COLUMN "timezone" TEXT;
ALTER TABLE "markets" ADD COLUMN "indoorOutdoor" "IndoorOutdoorMode";
ALTER TABLE "markets" ADD COLUMN "shortDescription" TEXT;
ALTER TABLE "markets" ADD COLUMN "vendorCategoryPolicy" JSONB;
ALTER TABLE "markets" ADD COLUMN "vendorApplicationState" "VendorApplicationState" NOT NULL DEFAULT 'NOT_ACCEPTING';
ALTER TABLE "markets" ADD COLUMN "vendorApplicationDeadline" TIMESTAMP(3);
ALTER TABLE "markets" ADD COLUMN "vendorWorkflowMode" "VendorWorkflowMode" NOT NULL DEFAULT 'INTENT_ONLY';
ALTER TABLE "markets" ADD COLUMN "termsAttested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "markets" ADD COLUMN "termsAttestedAt" TIMESTAMP(3);
ALTER TABLE "markets" ADD COLUMN "specialEventPermitStatus" "SpecialEventPermitStatus" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "markets" ADD COLUMN "expectedAttendance" INTEGER;
ALTER TABLE "markets" ADD COLUMN "streetClosureImpact" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "markets" ADD COLUMN "streetClosureNarrative" TEXT;
ALTER TABLE "markets" ADD COLUMN "insuranceSummary" TEXT;
ALTER TABLE "markets" ADD COLUMN "safetyPlanSummary" TEXT;
ALTER TABLE "markets" ADD COLUMN "sanitationPlan" TEXT;
ALTER TABLE "markets" ADD COLUMN "cancellationPolicy" TEXT;
ALTER TABLE "markets" ADD COLUMN "accessibilitySummary" TEXT;
ALTER TABLE "markets" ADD COLUMN "parkingSummary" TEXT;
ALTER TABLE "markets" ADD COLUMN "restroomAccess" "RestroomAccess";
ALTER TABLE "markets" ADD COLUMN "petPolicy" "PetPolicy";
ALTER TABLE "markets" ADD COLUMN "paymentMethodsPublic" JSONB;
ALTER TABLE "markets" ADD COLUMN "productHighlights" JSONB;
ALTER TABLE "markets" ADD COLUMN "typicalVendorCount" TEXT;
ALTER TABLE "markets" ADD COLUMN "feeModelVendor" TEXT;
ALTER TABLE "markets" ADD COLUMN "boothLogistics" TEXT;
ALTER TABLE "markets" ADD COLUMN "communicationChannels" TEXT;
ALTER TABLE "markets" ADD COLUMN "equityInclusionNotes" TEXT;
ALTER TABLE "markets" ADD COLUMN "verificationChecklist" JSONB;
ALTER TABLE "markets" ADD COLUMN "verificationReviewedAt" TIMESTAMP(3);
ALTER TABLE "markets" ADD COLUMN "verificationReviewedBy" TEXT;
ALTER TABLE "markets" ADD COLUMN "complianceFlagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "markets" ADD COLUMN "complianceNotes" TEXT;

-- AlterTable events
ALTER TABLE "events" ADD COLUMN "listingKind" "ListingKind";
ALTER TABLE "events" ADD COLUMN "organizerDisplayName" TEXT;
ALTER TABLE "events" ADD COLUMN "organizerPublicContact" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN "eventType" "OrganizerEventType";
ALTER TABLE "events" ADD COLUMN "occurrenceModel" "OccurrenceModel";
ALTER TABLE "events" ADD COLUMN "timezone" TEXT;
ALTER TABLE "events" ADD COLUMN "indoorOutdoor" "IndoorOutdoorMode";
ALTER TABLE "events" ADD COLUMN "shortDescription" TEXT;
ALTER TABLE "events" ADD COLUMN "vendorCategoryPolicy" JSONB;
ALTER TABLE "events" ADD COLUMN "vendorApplicationState" "VendorApplicationState";
ALTER TABLE "events" ADD COLUMN "vendorApplicationDeadline" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN "vendorWorkflowMode" "VendorWorkflowMode";
ALTER TABLE "events" ADD COLUMN "termsAttested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN "termsAttestedAt" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN "specialEventPermitStatus" "SpecialEventPermitStatus";
ALTER TABLE "events" ADD COLUMN "expectedAttendance" INTEGER;
ALTER TABLE "events" ADD COLUMN "streetClosureImpact" BOOLEAN;
ALTER TABLE "events" ADD COLUMN "streetClosureNarrative" TEXT;
ALTER TABLE "events" ADD COLUMN "insuranceSummary" TEXT;
ALTER TABLE "events" ADD COLUMN "safetyPlanSummary" TEXT;
ALTER TABLE "events" ADD COLUMN "sanitationPlan" TEXT;
ALTER TABLE "events" ADD COLUMN "cancellationPolicy" TEXT;
ALTER TABLE "events" ADD COLUMN "accessibilitySummary" TEXT;
ALTER TABLE "events" ADD COLUMN "parkingSummary" TEXT;
ALTER TABLE "events" ADD COLUMN "restroomAccess" "RestroomAccess";
ALTER TABLE "events" ADD COLUMN "petPolicy" "PetPolicy";
ALTER TABLE "events" ADD COLUMN "paymentMethodsPublic" JSONB;
ALTER TABLE "events" ADD COLUMN "productHighlights" JSONB;
ALTER TABLE "events" ADD COLUMN "typicalVendorCount" TEXT;
ALTER TABLE "events" ADD COLUMN "feeModelVendor" TEXT;
ALTER TABLE "events" ADD COLUMN "boothLogistics" TEXT;
ALTER TABLE "events" ADD COLUMN "communicationChannels" TEXT;
ALTER TABLE "events" ADD COLUMN "equityInclusionNotes" TEXT;
ALTER TABLE "events" ADD COLUMN "verificationChecklist" JSONB;
ALTER TABLE "events" ADD COLUMN "verificationReviewedAt" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN "verificationReviewedBy" TEXT;
ALTER TABLE "events" ADD COLUMN "complianceFlagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN "complianceNotes" TEXT;

CREATE INDEX "markets_vendorApplicationState_vendorApplicationDeadline_idx" ON "markets"("vendorApplicationState", "vendorApplicationDeadline");
CREATE INDEX "markets_complianceFlagged_idx" ON "markets"("complianceFlagged");
CREATE INDEX "events_vendorApplicationState_vendorApplicationDeadline_idx" ON "events"("vendorApplicationState", "vendorApplicationDeadline");
CREATE INDEX "events_complianceFlagged_idx" ON "events"("complianceFlagged");

-- CreateTable
CREATE TABLE "listing_evidences" (
    "id" TEXT NOT NULL,
    "marketId" TEXT,
    "eventId" TEXT,
    "type" "ListingEvidenceType" NOT NULL,
    "title" TEXT,
    "fileUrl" TEXT NOT NULL,
    "visibility" "ListingEvidenceVisibility" NOT NULL DEFAULT 'ADMIN_ONLY',
    "uploadedById" TEXT,
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_moderation_notes" (
    "id" TEXT NOT NULL,
    "marketId" TEXT,
    "eventId" TEXT,
    "authorId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "visibility" "ListingModerationNoteVisibility" NOT NULL DEFAULT 'ADMIN_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_moderation_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "listing_evidences_marketId_idx" ON "listing_evidences"("marketId");
CREATE INDEX "listing_evidences_eventId_idx" ON "listing_evidences"("eventId");
CREATE INDEX "listing_evidences_type_idx" ON "listing_evidences"("type");
CREATE INDEX "listing_evidences_visibility_idx" ON "listing_evidences"("visibility");

CREATE INDEX "listing_moderation_notes_marketId_idx" ON "listing_moderation_notes"("marketId");
CREATE INDEX "listing_moderation_notes_eventId_idx" ON "listing_moderation_notes"("eventId");
CREATE INDEX "listing_moderation_notes_authorId_idx" ON "listing_moderation_notes"("authorId");
CREATE INDEX "listing_moderation_notes_visibility_idx" ON "listing_moderation_notes"("visibility");

ALTER TABLE "listing_evidences" ADD CONSTRAINT "listing_evidences_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_evidences" ADD CONSTRAINT "listing_evidences_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_evidences" ADD CONSTRAINT "listing_evidences_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "listing_moderation_notes" ADD CONSTRAINT "listing_moderation_notes_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_moderation_notes" ADD CONSTRAINT "listing_moderation_notes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_moderation_notes" ADD CONSTRAINT "listing_moderation_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
