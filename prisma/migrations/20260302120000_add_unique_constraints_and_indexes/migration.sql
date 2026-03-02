-- Dedupe: Remove duplicate reviews (keep oldest per userId+eventId)
DELETE FROM "reviews" r1
WHERE r1."eventId" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "reviews" r2
    WHERE r2."userId" = r1."userId" AND r2."eventId" = r1."eventId"
      AND r2."createdAt" < r1."createdAt"
  );

-- Dedupe: Remove duplicate reviews (keep oldest per userId+marketId)
DELETE FROM "reviews" r1
WHERE r1."marketId" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "reviews" r2
    WHERE r2."userId" = r1."userId" AND r2."marketId" = r1."marketId"
      AND r2."createdAt" < r1."createdAt"
  );

-- Dedupe: Remove duplicate claim requests (keep most recent per userId+marketId)
DELETE FROM "claim_requests" r1
WHERE EXISTS (
  SELECT 1 FROM "claim_requests" r2
  WHERE r2."userId" = r1."userId" AND r2."marketId" = r1."marketId"
    AND r2."createdAt" > r1."createdAt"
);

-- Dedupe: Remove duplicate vendor claim requests (keep most recent per userId+vendorProfileId)
DELETE FROM "vendor_claim_requests" r1
WHERE EXISTS (
  SELECT 1 FROM "vendor_claim_requests" r2
  WHERE r2."userId" = r1."userId" AND r2."vendorProfileId" = r1."vendorProfileId"
    AND r2."createdAt" > r1."createdAt"
);

-- CreateIndex: Event status+startDate for list queries
CREATE INDEX "events_status_startDate_idx" ON "events"("status", "startDate");

-- CreateIndex: Review createdAt for admin ordering
CREATE INDEX "reviews_createdAt_idx" ON "reviews"("createdAt");

-- CreateIndex: Partial unique for Review (userId, eventId) where eventId IS NOT NULL
CREATE UNIQUE INDEX "reviews_userId_eventId_key" ON "reviews"("userId", "eventId") WHERE "eventId" IS NOT NULL;

-- CreateIndex: Partial unique for Review (userId, marketId) where marketId IS NOT NULL
CREATE UNIQUE INDEX "reviews_userId_marketId_key" ON "reviews"("userId", "marketId") WHERE "marketId" IS NOT NULL;

-- CreateIndex: Unique for ClaimRequest
CREATE UNIQUE INDEX "claim_requests_userId_marketId_key" ON "claim_requests"("userId", "marketId");

-- CreateIndex: Unique for VendorClaimRequest
CREATE UNIQUE INDEX "vendor_claim_requests_userId_vendorProfileId_key" ON "vendor_claim_requests"("userId", "vendorProfileId");
