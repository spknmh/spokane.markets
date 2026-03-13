-- Allow each event to optionally show its image on listing cards.
ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "showImageInList" BOOLEAN NOT NULL DEFAULT false;
