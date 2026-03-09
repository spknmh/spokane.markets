/**
 * Legacy mapping for dual-read compatibility.
 * Maps between legacy IDs (events.id, markets.id) and new model IDs (eventOccurrences.id, marketSeries.id).
 * Used when USE_NEW_MODELS=true to resolve legacy references (e.g. Attendance.eventId, Report.targetId).
 */

import { db } from "@/lib/db";

export async function getEventOccurrenceByLegacyId(
  legacyEventId: string
): Promise<{ id: string; slug: string } | null> {
  const eo = await db.eventOccurrence.findUnique({
    where: { legacyEventId },
    select: { id: true, slug: true },
  });
  return eo;
}

export async function getMarketSeriesByLegacyId(
  legacyMarketId: string
): Promise<{ id: string; slug: string } | null> {
  const ms = await db.marketSeries.findUnique({
    where: { legacyMarketId },
    select: { id: true, slug: true },
  });
  return ms;
}

export async function getLegacyEventIdByOccurrenceId(
  occurrenceId: string
): Promise<string | null> {
  const eo = await db.eventOccurrence.findUnique({
    where: { id: occurrenceId },
    select: { legacyEventId: true },
  });
  return eo?.legacyEventId ?? null;
}

export async function getLegacyMarketIdBySeriesId(
  seriesId: string
): Promise<string | null> {
  const ms = await db.marketSeries.findUnique({
    where: { id: seriesId },
    select: { legacyMarketId: true },
  });
  return ms?.legacyMarketId ?? null;
}
