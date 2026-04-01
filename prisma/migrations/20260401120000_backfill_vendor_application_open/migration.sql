-- Legacy: participation modes that accept roster requests should remain open after onboarding columns default to NOT_ACCEPTING.
UPDATE "markets"
SET "vendorApplicationState" = 'OPEN'
WHERE "participationMode" IN ('REQUEST_TO_JOIN', 'CAPACITY_LIMITED');

UPDATE "events"
SET "vendorApplicationState" = 'OPEN'
WHERE "participationMode" IN ('REQUEST_TO_JOIN', 'CAPACITY_LIMITED');

UPDATE "events" AS e
SET "vendorApplicationState" = 'OPEN'
FROM "markets" AS m
WHERE e."marketId" = m.id
  AND e."participationMode" IS NULL
  AND m."participationMode" IN ('REQUEST_TO_JOIN', 'CAPACITY_LIMITED');
