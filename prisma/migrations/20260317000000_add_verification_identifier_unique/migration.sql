-- Add unique constraint to verification.identifier so Better Auth can use it in
-- Prisma where clauses (update/delete require unique fields).
-- Fixes: PrismaClientValidationError "needs at least one of `id` arguments"
-- when magic link verification calls updateVerificationByIdentifier.
CREATE UNIQUE INDEX "verification_identifier_key" ON "verification"("identifier");
