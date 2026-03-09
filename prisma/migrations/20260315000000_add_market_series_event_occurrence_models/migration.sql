-- Additive migration: new refactored models. Old tables (markets, events, venues, vendor_profiles, etc.) remain for dual-read.

-- CreateEnum
CREATE TYPE "VendorAppearanceSource" AS ENUM ('SELF_REPORTED', 'INTENT', 'ROSTER');

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "neighborhood" TEXT,
    "parkingNotes" TEXT,
    "legacyVenueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_series" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "websiteUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "baseArea" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "ownerId" TEXT,
    "typicalSchedule" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "participationMode" "ParticipationMode" NOT NULL DEFAULT 'OPEN',
    "vendorCapacity" INTEGER,
    "publicIntentListEnabled" BOOLEAN NOT NULL DEFAULT true,
    "publicIntentNamesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "publicRosterEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rosterClaimRequired" BOOLEAN NOT NULL DEFAULT false,
    "legacyMarketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_occurrences" (
    "id" TEXT NOT NULL,
    "marketSeriesId" TEXT,
    "locationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT,
    "imageUrl" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "recurrenceGroupId" TEXT,
    "websiteUrl" TEXT,
    "facebookUrl" TEXT,
    "participationMode" "ParticipationMode",
    "vendorCapacity" INTEGER,
    "publicIntentListEnabled" BOOLEAN,
    "publicIntentNamesEnabled" BOOLEAN,
    "publicRosterEnabled" BOOLEAN,
    "submittedById" TEXT,
    "legacyEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_occurrence_schedule_days" (
    "id" TEXT NOT NULL,
    "eventOccurrenceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "event_occurrence_schedule_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "websiteUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specialties" TEXT,
    "contactVisible" BOOLEAN NOT NULL DEFAULT true,
    "socialLinksVisible" BOOLEAN NOT NULL DEFAULT true,
    "legacyVendorProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_appearances" (
    "id" TEXT NOT NULL,
    "eventOccurrenceId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "source" "VendorAppearanceSource" NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "visibility" "IntentVisibility" NOT NULL DEFAULT 'PRIVATE',
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_appearances_pkey" PRIMARY KEY ("id")
);

-- CreateTable (implicit many-to-many for EventOccurrence <-> Tag)
CREATE TABLE "_EventOccurrenceTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable (implicit many-to-many for EventOccurrence <-> Feature)
CREATE TABLE "_EventOccurrenceFeatures" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_legacyVenueId_key" ON "locations"("legacyVenueId");
CREATE INDEX "locations_neighborhood_idx" ON "locations"("neighborhood");

-- CreateIndex
CREATE UNIQUE INDEX "market_series_slug_key" ON "market_series"("slug");
CREATE UNIQUE INDEX "market_series_legacyMarketId_key" ON "market_series"("legacyMarketId");
CREATE INDEX "market_series_locationId_idx" ON "market_series"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "event_occurrences_slug_key" ON "event_occurrences"("slug");
CREATE UNIQUE INDEX "event_occurrences_legacyEventId_key" ON "event_occurrences"("legacyEventId");
CREATE INDEX "event_occurrences_startDate_idx" ON "event_occurrences"("startDate");
CREATE INDEX "event_occurrences_status_idx" ON "event_occurrences"("status");
CREATE INDEX "event_occurrences_status_startDate_idx" ON "event_occurrences"("status", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "event_occurrence_schedule_days_eventOccurrenceId_date_key" ON "event_occurrence_schedule_days"("eventOccurrenceId", "date");
CREATE INDEX "event_occurrence_schedule_days_eventOccurrenceId_idx" ON "event_occurrence_schedule_days"("eventOccurrenceId");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_slug_key" ON "vendors"("slug");
CREATE UNIQUE INDEX "vendors_userId_key" ON "vendors"("userId");
CREATE UNIQUE INDEX "vendors_legacyVendorProfileId_key" ON "vendors"("legacyVendorProfileId");
CREATE INDEX "vendors_slug_idx" ON "vendors"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_appearances_eventOccurrenceId_vendorId_source_key" ON "vendor_appearances"("eventOccurrenceId", "vendorId", "source");
CREATE INDEX "vendor_appearances_eventOccurrenceId_idx" ON "vendor_appearances"("eventOccurrenceId");
CREATE INDEX "vendor_appearances_vendorId_idx" ON "vendor_appearances"("vendorId");

-- CreateIndex (many-to-many)
CREATE UNIQUE INDEX "_EventOccurrenceTags_AB_unique" ON "_EventOccurrenceTags"("A", "B");
CREATE INDEX "_EventOccurrenceTags_B_index" ON "_EventOccurrenceTags"("B");

CREATE UNIQUE INDEX "_EventOccurrenceFeatures_AB_unique" ON "_EventOccurrenceFeatures"("A", "B");
CREATE INDEX "_EventOccurrenceFeatures_B_index" ON "_EventOccurrenceFeatures"("B");

-- AddForeignKey
ALTER TABLE "market_series" ADD CONSTRAINT "market_series_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "market_series" ADD CONSTRAINT "market_series_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_marketSeriesId_fkey" FOREIGN KEY ("marketSeriesId") REFERENCES "market_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_occurrence_schedule_days" ADD CONSTRAINT "event_occurrence_schedule_days_eventOccurrenceId_fkey" FOREIGN KEY ("eventOccurrenceId") REFERENCES "event_occurrences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_appearances" ADD CONSTRAINT "vendor_appearances_eventOccurrenceId_fkey" FOREIGN KEY ("eventOccurrenceId") REFERENCES "event_occurrences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_appearances" ADD CONSTRAINT "vendor_appearances_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (many-to-many)
ALTER TABLE "_EventOccurrenceTags" ADD CONSTRAINT "_EventOccurrenceTags_A_fkey" FOREIGN KEY ("A") REFERENCES "event_occurrences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_EventOccurrenceTags" ADD CONSTRAINT "_EventOccurrenceTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_EventOccurrenceFeatures" ADD CONSTRAINT "_EventOccurrenceFeatures_A_fkey" FOREIGN KEY ("A") REFERENCES "event_occurrences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_EventOccurrenceFeatures" ADD CONSTRAINT "_EventOccurrenceFeatures_B_fkey" FOREIGN KEY ("B") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;
