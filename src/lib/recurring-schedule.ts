/**
 * Generate schedule days from a recurring rule (e.g., every Wed and Sat from date A to date B).
 * Used by ScheduleRecurringGenerator to expand into EventScheduleDay-compatible entries.
 */

export const MAX_RECURRING_DAYS = 365;

export type ScheduleDay = {
  date: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
};

/**
 * Expand a recurring rule into individual schedule days.
 * @param weekdays - 0=Sun, 1=Mon, ..., 6=Sat
 * @param startDate - YYYY-MM-DD
 * @param endDate - YYYY-MM-DD
 * @param allDay - if true, use 00:00-23:59
 * @param startTime - HH:mm (required when not allDay)
 * @param endTime - HH:mm (required when not allDay)
 * @returns Array of ScheduleDay objects, truncated to MAX_RECURRING_DAYS if exceeded
 */
export function generateRecurringSchedule(
  weekdays: number[],
  startDate: string,
  endDate: string,
  allDay: boolean,
  startTime?: string,
  endTime?: string
): ScheduleDay[] {
  if (weekdays.length === 0) return [];

  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T23:59:59");
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [];
  }

  const result: ScheduleDay[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  while (current <= end && result.length < MAX_RECURRING_DAYS) {
    const dayOfWeek = current.getDay();
    if (weekdays.includes(dayOfWeek)) {
      const dateStr = current.toISOString().slice(0, 10);
      result.push({
        date: dateStr,
        allDay,
        ...(allDay ? {} : { startTime: startTime ?? "00:00", endTime: endTime ?? "23:59" }),
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return result;
}
