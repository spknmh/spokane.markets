import { formatTime12hr } from "@/lib/utils";

/** One row for structured schedule display (e.g. admin review table). */
export type SubmissionScheduleRow = {
  date: string;
  timeLabel: string;
};

type ScheduleDayJson = {
  date: string;
  allDay?: boolean;
  startTime?: string;
  endTime?: string;
};

function isFullDayDay(d: ScheduleDayJson): boolean {
  return d.allDay === true || (d.startTime === "00:00" && d.endTime === "23:59");
}

function timeLabelForScheduleDay(d: ScheduleDayJson, fallbackEventTime: string): string {
  if (isFullDayDay(d)) return "All day";
  const start = d.startTime ?? fallbackEventTime;
  const end = d.endTime;
  if (end && end !== start) {
    return `${formatTime12hr(start)} – ${formatTime12hr(end)}`;
  }
  return formatTime12hr(start);
}

/**
 * Normalized schedule rows for review UI (per-day when `scheduleDays` is present).
 * Falls back to a single row from legacy `eventDate` / `eventTime` fields.
 */
export function parseSubmissionScheduleRows(sub: {
  scheduleDays: unknown;
  eventDate: string;
  eventTime: string;
  endDate: string | null;
  endTime: string | null;
  allDay: boolean;
}): SubmissionScheduleRow[] {
  if (sub.scheduleDays && Array.isArray(sub.scheduleDays)) {
    const days = sub.scheduleDays as ScheduleDayJson[];
    if (days.length === 0) {
      return legacyScheduleRows(sub);
    }
    return days.map((d) => ({
      date: d.date,
      timeLabel: timeLabelForScheduleDay(d, sub.eventTime),
    }));
  }
  return legacyScheduleRows(sub);
}

function legacyScheduleRows(sub: {
  eventDate: string;
  eventTime: string;
  endDate: string | null;
  endTime: string | null;
  allDay: boolean;
}): SubmissionScheduleRow[] {
  const dateStr =
    sub.endDate && sub.endDate !== sub.eventDate ? `${sub.eventDate} – ${sub.endDate}` : sub.eventDate;

  if (sub.allDay) {
    return [{ date: dateStr, timeLabel: "All day" }];
  }

  const start = formatTime12hr(sub.eventTime);
  if (sub.endTime && sub.endTime !== sub.eventTime) {
    return [{ date: dateStr, timeLabel: `${start} – ${formatTime12hr(sub.endTime)}` }];
  }
  return [{ date: dateStr, timeLabel: start }];
}

/** Display string for a submission row (list + review page). */
export function formatSubmissionScheduleSummary(sub: {
  scheduleDays: unknown;
  eventDate: string;
  eventTime: string;
  endDate: string | null;
  endTime: string | null;
  allDay: boolean;
}): string {
  if (sub.scheduleDays && Array.isArray(sub.scheduleDays)) {
    const days = sub.scheduleDays as {
      date: string;
      allDay?: boolean;
      startTime?: string;
      endTime?: string;
    }[];
    if (days.length === 0) {
      return sub.eventDate;
    }
    if (days.length === 1) {
      const d = days[0];
      const fullDay =
        d.allDay === true || (d.startTime === "00:00" && d.endTime === "23:59");
      if (fullDay) {
        return `${d.date} (all day)`;
      }
      const start = d.startTime ?? sub.eventTime;
      const end = d.endTime;
      return `${d.date} at ${formatTime12hr(start)}${
        end && end !== start ? ` – ${formatTime12hr(end)}` : ""
      }`;
    }
    return `${days[0].date} – ${days[days.length - 1].date} (${days.length} days)`;
  }
  return [
    sub.eventDate,
    sub.allDay ? " (all day)" : ` at ${formatTime12hr(sub.eventTime)}`,
    sub.endDate && sub.endDate !== sub.eventDate ? ` – ${sub.endDate}` : "",
    sub.endTime && !sub.allDay && sub.endTime !== sub.eventTime ? ` at ${formatTime12hr(sub.endTime)}` : "",
  ].join("");
}
