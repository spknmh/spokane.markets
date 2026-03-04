/**
 * Shared date range helpers for home page sections and event filtering.
 */

/** Returns the upcoming weekend (Saturday–Sunday) date range. */
export function getUpcomingWeekendRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();

  const start = new Date(now);
  if (day === 0) {
    start.setDate(now.getDate());
    start.setHours(0, 0, 0, 0);
  } else if (day === 6) {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(now.getDate() + (6 - day));
    start.setHours(0, 0, 0, 0);
  }

  const end = new Date(start);
  end.setDate(start.getDate() + (start.getDay() === 6 ? 2 : 1));
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/** Returns the Plan in Advance range: events 14–28 days from today. */
export function getPlanAheadRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() + 14);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 14);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
