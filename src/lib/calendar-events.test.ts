import { describe, expect, it } from "vitest";
import { eventOccursInMonth, getEventDaysInMonth, type CalendarEventLike } from "./calendar-events";

function createEvent(overrides: Partial<CalendarEventLike> = {}): CalendarEventLike {
  return {
    startDate: new Date("2026-03-01T00:00:00Z"),
    endDate: new Date("2026-03-31T23:59:00Z"),
    scheduleDays: [],
    ...overrides,
  };
}

describe("calendar event month expansion", () => {
  it("uses explicit schedule days instead of filling the entire start-to-end range", () => {
    const event = createEvent({
      startDate: new Date("2026-03-01T00:00:00Z"),
      endDate: new Date("2026-03-31T23:59:00Z"),
      scheduleDays: [
        { date: new Date("2026-03-05T00:00:00Z") },
        { date: new Date("2026-03-19T00:00:00Z") },
      ],
    });

    expect(getEventDaysInMonth(event, 2026, 2)).toEqual([5, 19]);
  });

  it("does not show a scheduled event in months without matching schedule days", () => {
    const event = createEvent({
      startDate: new Date("2026-03-01T00:00:00Z"),
      endDate: new Date("2026-05-31T23:59:00Z"),
      scheduleDays: [{ date: new Date("2026-03-08T00:00:00Z") }],
    });

    expect(eventOccursInMonth(event, 2026, 3)).toBe(false);
    expect(getEventDaysInMonth(event, 2026, 3)).toEqual([]);
  });

  it("falls back to the continuous event range when schedule days are absent", () => {
    const event = createEvent({
      startDate: new Date("2026-03-29T12:00:00Z"),
      endDate: new Date("2026-04-02T18:00:00Z"),
    });

    expect(getEventDaysInMonth(event, 2026, 2)).toEqual([29, 30, 31]);
    expect(getEventDaysInMonth(event, 2026, 3)).toEqual([1, 2]);
  });
});
