-- Neighborhoods now sort alphabetically by label.
-- Remove explicit sort order column and replace index accordingly.

DROP INDEX IF EXISTS "neighborhoods_isActive_sortOrder_idx";

ALTER TABLE "neighborhoods"
DROP COLUMN IF EXISTS "sortOrder";

CREATE INDEX IF NOT EXISTS "neighborhoods_isActive_label_idx"
ON "neighborhoods" ("isActive", "label");
