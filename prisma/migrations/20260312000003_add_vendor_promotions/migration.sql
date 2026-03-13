ALTER TABLE "promotions"
ADD COLUMN IF NOT EXISTS "vendorProfileId" TEXT;

CREATE INDEX IF NOT EXISTS "promotions_vendorProfileId_idx"
ON "promotions"("vendorProfileId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'promotions_vendorProfileId_fkey'
      AND table_name = 'promotions'
  ) THEN
    ALTER TABLE "promotions"
      ADD CONSTRAINT "promotions_vendorProfileId_fkey"
      FOREIGN KEY ("vendorProfileId")
      REFERENCES "vendor_profiles"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
