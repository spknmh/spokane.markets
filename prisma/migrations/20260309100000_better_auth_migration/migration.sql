-- Better Auth Migration: NextAuth v5 → Better Auth
-- Renames columns, changes types, adds missing fields

-- ═══════════════════════════════════════════════════════════════
-- 1. Sessions table
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE "sessions" RENAME COLUMN "sessionToken" TO "token";
ALTER TABLE "sessions" RENAME COLUMN "expires" TO "expiresAt";
ALTER TABLE "sessions" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "sessions" ADD COLUMN "userAgent" TEXT;

-- ═══════════════════════════════════════════════════════════════
-- 2. Accounts table
-- ═══════════════════════════════════════════════════════════════

-- Rename columns
ALTER TABLE "accounts" RENAME COLUMN "provider" TO "providerId";
ALTER TABLE "accounts" RENAME COLUMN "providerAccountId" TO "accountId";
ALTER TABLE "accounts" RENAME COLUMN "access_token" TO "accessToken";
ALTER TABLE "accounts" RENAME COLUMN "refresh_token" TO "refreshToken";
ALTER TABLE "accounts" RENAME COLUMN "id_token" TO "idToken";

-- Add new columns
ALTER TABLE "accounts" ADD COLUMN "password" TEXT;
ALTER TABLE "accounts" ADD COLUMN "accessTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "accounts" ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3);

-- Convert expires_at (Int, seconds since epoch) → accessTokenExpiresAt (DateTime)
UPDATE "accounts"
SET "accessTokenExpiresAt" = to_timestamp("expires_at")
WHERE "expires_at" IS NOT NULL;

-- Drop old/unused columns
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "expires_at";
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "type";
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "token_type";
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "session_state";

-- Update unique constraint
ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "accounts_provider_providerAccountId_key";
CREATE UNIQUE INDEX "accounts_providerId_accountId_key" ON "accounts"("providerId", "accountId");

-- ═══════════════════════════════════════════════════════════════
-- 3. Users table: emailVerified DateTime? → Boolean
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE "users" ADD COLUMN "emailVerified_new" BOOLEAN NOT NULL DEFAULT false;
UPDATE "users" SET "emailVerified_new" = true WHERE "emailVerified" IS NOT NULL;
ALTER TABLE "users" DROP COLUMN "emailVerified";
ALTER TABLE "users" RENAME COLUMN "emailVerified_new" TO "emailVerified";

-- ═══════════════════════════════════════════════════════════════
-- 4. Verification: drop old table, create new
-- ═══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS "verification_tokens";

CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);
