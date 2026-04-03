import { formatTime12hr } from "@/lib/utils";

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
