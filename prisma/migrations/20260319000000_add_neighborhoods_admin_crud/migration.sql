-- Create neighborhoods source-of-truth table.
CREATE TABLE "neighborhoods" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "neighborhoods_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "neighborhoods_slug_key" ON "neighborhoods"("slug");
CREATE INDEX "neighborhoods_isActive_sortOrder_idx" ON "neighborhoods"("isActive", "sortOrder");

-- Seed canonical neighborhoods.
INSERT INTO "neighborhoods" ("id", "slug", "label", "sortOrder", "updatedAt")
VALUES
  ('neighborhood_downtown', 'downtown', 'Downtown / Riverfront', 10, CURRENT_TIMESTAMP),
  ('neighborhood_kendall_yards', 'kendall-yards', 'Kendall Yards', 20, CURRENT_TIMESTAMP),
  ('neighborhood_south_hill', 'south-hill', 'South Hill / Perry District', 30, CURRENT_TIMESTAMP),
  ('neighborhood_garland', 'garland', 'Garland / North Monroe', 40, CURRENT_TIMESTAMP),
  ('neighborhood_north_spokane', 'north-spokane', 'North Spokane / Mead', 50, CURRENT_TIMESTAMP),
  ('neighborhood_spokane_valley', 'spokane-valley', 'Spokane Valley / Millwood', 60, CURRENT_TIMESTAMP),
  ('neighborhood_liberty_lake', 'liberty-lake', 'Liberty Lake', 70, CURRENT_TIMESTAMP),
  ('neighborhood_cheney', 'cheney', 'Cheney / Airway Heights', 80, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE
SET "label" = EXCLUDED."label",
    "sortOrder" = EXCLUDED."sortOrder",
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP;

-- Normalize legacy/free-form values to canonical slugs.
CREATE OR REPLACE FUNCTION normalize_neighborhood_slug(raw_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  cleaned TEXT;
BEGIN
  IF raw_value IS NULL OR btrim(raw_value) = '' THEN
    RETURN NULL;
  END IF;

  cleaned := regexp_replace(lower(btrim(raw_value)), '[^a-z0-9]+', '-', 'g');
  cleaned := regexp_replace(cleaned, '(^-+|-+$)', '', 'g');

  IF cleaned IN (
    'downtown',
    'kendall-yards',
    'south-hill',
    'garland',
    'north-spokane',
    'spokane-valley',
    'liberty-lake',
    'cheney'
  ) THEN
    RETURN cleaned;
  END IF;

  CASE cleaned
    WHEN 'downtown-riverfront' THEN RETURN 'downtown';
    WHEN 'south-hill-perry-district' THEN RETURN 'south-hill';
    WHEN 'perry-district' THEN RETURN 'south-hill';
    WHEN 'emerson-garfield' THEN RETURN 'garland';
    WHEN 'garland-north-monroe' THEN RETURN 'garland';
    WHEN 'north-monroe' THEN RETURN 'garland';
    WHEN 'north-spokane-mead' THEN RETURN 'north-spokane';
    WHEN 'mead' THEN RETURN 'north-spokane';
    WHEN 'spokane-valley-millwood' THEN RETURN 'spokane-valley';
    WHEN 'millwood' THEN RETURN 'spokane-valley';
    WHEN 'cheney-airway-heights' THEN RETURN 'cheney';
    WHEN 'airway-heights' THEN RETURN 'cheney';
    ELSE
      RETURN NULL;
  END CASE;
END;
$$;

UPDATE "venues"
SET "neighborhood" = normalize_neighborhood_slug("neighborhood")
WHERE "neighborhood" IS NOT NULL;

UPDATE "markets"
SET "baseArea" = normalize_neighborhood_slug("baseArea")
WHERE "baseArea" IS NOT NULL;

UPDATE "subscribers"
SET "areas" = COALESCE((
  SELECT array_agg(mapped ORDER BY mapped)
  FROM (
    SELECT DISTINCT normalize_neighborhood_slug(area) AS mapped
    FROM unnest("areas") AS area
  ) normalized
  WHERE mapped IS NOT NULL
), ARRAY[]::TEXT[]);

UPDATE "saved_filters"
SET "neighborhoods" = COALESCE((
  SELECT array_agg(mapped ORDER BY mapped)
  FROM (
    SELECT DISTINCT normalize_neighborhood_slug(area) AS mapped
    FROM unnest("neighborhoods") AS area
  ) normalized
  WHERE mapped IS NOT NULL
), ARRAY[]::TEXT[]);

-- Fail migration if unresolved values remain.
DO $$
DECLARE
  invalid_venues INTEGER;
  invalid_markets INTEGER;
  invalid_subscriber_areas INTEGER;
  invalid_filter_areas INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO invalid_venues
  FROM "venues" v
  WHERE v."neighborhood" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM "neighborhoods" n WHERE n."slug" = v."neighborhood");

  SELECT COUNT(*)
  INTO invalid_markets
  FROM "markets" m
  WHERE m."baseArea" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM "neighborhoods" n WHERE n."slug" = m."baseArea");

  SELECT COUNT(*)
  INTO invalid_subscriber_areas
  FROM "subscribers" s
  WHERE EXISTS (
    SELECT 1
    FROM unnest(s."areas") AS area
    WHERE NOT EXISTS (SELECT 1 FROM "neighborhoods" n WHERE n."slug" = area)
  );

  SELECT COUNT(*)
  INTO invalid_filter_areas
  FROM "saved_filters" sf
  WHERE EXISTS (
    SELECT 1
    FROM unnest(sf."neighborhoods") AS area
    WHERE NOT EXISTS (SELECT 1 FROM "neighborhoods" n WHERE n."slug" = area)
  );

  IF invalid_venues > 0 OR invalid_markets > 0 OR invalid_subscriber_areas > 0 OR invalid_filter_areas > 0 THEN
    RAISE EXCEPTION
      'Neighborhood migration failed: unresolved values remain (venues=%, markets=%, subscribers=%, filters=%).',
      invalid_venues, invalid_markets, invalid_subscriber_areas, invalid_filter_areas;
  END IF;
END;
$$;

DROP FUNCTION normalize_neighborhood_slug(TEXT);

ALTER TABLE "venues"
ADD CONSTRAINT "venues_neighborhood_fkey"
FOREIGN KEY ("neighborhood") REFERENCES "neighborhoods"("slug")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "markets"
ADD CONSTRAINT "markets_baseArea_fkey"
FOREIGN KEY ("baseArea") REFERENCES "neighborhoods"("slug")
ON DELETE SET NULL ON UPDATE CASCADE;
