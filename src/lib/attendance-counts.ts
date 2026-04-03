import { db } from "@/lib/db";

export type AttendanceCountsMap = Record<string, { going: number; interested: number }>;

/**
 * Batch-load GOING / INTERESTED attendance counts for many events (e.g. listing cards).
 */
export async function getAttendanceCountsByEventIds(eventIds: string[]): Promise<AttendanceCountsMap> {
  if (eventIds.length === 0) return {};

  const rows = await db.attendance.groupBy({
    by: ["eventId", "status"],
    where: {
      eventId: { in: eventIds },
      status: { in: ["GOING", "INTERESTED"] },
    },
    _count: { _all: true },
  });

  const map: AttendanceCountsMap = {};
  for (const id of eventIds) {
    map[id] = { going: 0, interested: 0 };
  }
  for (const row of rows) {
    const entry = map[row.eventId];
    if (!entry) continue;
    if (row.status === "GOING") entry.going = row._count._all;
    if (row.status === "INTERESTED") entry.interested = row._count._all;
  }
  return map;
}
