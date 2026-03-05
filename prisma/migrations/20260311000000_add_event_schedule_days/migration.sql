-- CreateTable
CREATE TABLE "event_schedule_days" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "event_schedule_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_schedule_days_eventId_date_key" ON "event_schedule_days"("eventId", "date");

-- CreateIndex
CREATE INDEX "event_schedule_days_eventId_idx" ON "event_schedule_days"("eventId");

-- AddForeignKey
ALTER TABLE "event_schedule_days" ADD CONSTRAINT "event_schedule_days_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
