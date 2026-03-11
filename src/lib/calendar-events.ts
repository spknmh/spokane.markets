type CalendarScheduleDay = {
  date: Date | string;
};

export type CalendarEventLike = {
  startDate: Date | string;
  endDate: Date | string;
  scheduleDays: CalendarScheduleDay[];
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? new Date(value) : new Date(value);
}

function getUtcDayParts(value: Date | string) {
  const date = toDate(value);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

export function getEventDaysInMonth(
  event: CalendarEventLike,
  year: number,
  month: number
): number[] {
  const daysToShow = new Set<number>();

  if (event.scheduleDays.length > 0) {
    for (const scheduleDay of event.scheduleDays) {
      const day = getUtcDayParts(scheduleDay.date);
      if (day.year === year && day.month === month) {
        daysToShow.add(day.day);
      }
    }
    return [...daysToShow].sort((a, b) => a - b);
  }

  const start = toDate(event.startDate);
  start.setHours(0, 0, 0, 0);
  const end = toDate(event.endDate);
  end.setHours(23, 59, 59, 999);

  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    if (day.getFullYear() === year && day.getMonth() === month) {
      daysToShow.add(day.getDate());
    }
  }

  return [...daysToShow].sort((a, b) => a - b);
}

export function eventOccursInMonth(
  event: CalendarEventLike,
  year: number,
  month: number
): boolean {
  return getEventDaysInMonth(event, year, month).length > 0;
}
