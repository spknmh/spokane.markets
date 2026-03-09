-- Drop MarketSeries/EventOccurrence architecture. Reverting to legacy Event/Market/Venue models only.

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS "vendor_appearances";
DROP TABLE IF EXISTS "event_occurrence_schedule_days";
DROP TABLE IF EXISTS "_EventOccurrenceTags";
DROP TABLE IF EXISTS "_EventOccurrenceFeatures";
DROP TABLE IF EXISTS "event_occurrences";
DROP TABLE IF EXISTS "market_series";
DROP TABLE IF EXISTS "vendors";
DROP TABLE IF EXISTS "locations";

-- Drop enum
DROP TYPE IF EXISTS "VendorAppearanceSource";
