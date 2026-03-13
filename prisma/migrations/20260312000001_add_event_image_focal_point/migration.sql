-- Add per-event focal point controls for banner crops.
ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "imageFocalX" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS "imageFocalY" INTEGER NOT NULL DEFAULT 50;
