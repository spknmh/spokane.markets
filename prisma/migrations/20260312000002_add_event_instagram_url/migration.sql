-- Allow events to store an Instagram URL.
ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
