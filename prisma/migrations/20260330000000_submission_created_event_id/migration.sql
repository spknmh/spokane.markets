-- AlterTable
ALTER TABLE "submissions" ADD COLUMN "createdEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "submissions_createdEventId_key" ON "submissions"("createdEventId");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_createdEventId_fkey" FOREIGN KEY ("createdEventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
