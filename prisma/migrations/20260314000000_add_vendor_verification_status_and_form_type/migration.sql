-- Add new application form enum value for vendor verification workflows
ALTER TYPE "ApplicationFormType" ADD VALUE IF NOT EXISTS 'VENDOR_VERIFICATION';

-- Add vendor profile verification status with a safe default
ALTER TABLE "vendor_profiles"
ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED';
