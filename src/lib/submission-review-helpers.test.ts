import { describe, expect, it } from "vitest";
import { parseSubmissionScheduleRows } from "@/lib/submission-display";
import { getSubmissionCompletenessChecks } from "@/lib/submission-review-completeness";

describe("parseSubmissionScheduleRows", () => {
  it("maps scheduleDays JSON to one row per day", () => {
    const rows = parseSubmissionScheduleRows({
      scheduleDays: [
        { date: "2026-06-01", startTime: "10:00", endTime: "12:00" },
        { date: "2026-06-02", startTime: "14:00", endTime: "16:00" },
      ],
      eventDate: "2026-06-01",
      eventTime: "10:00",
      endDate: null,
      endTime: null,
      allDay: false,
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ date: "2026-06-01", timeLabel: "10:00 AM – 12:00 PM" });
    expect(rows[1]).toEqual({ date: "2026-06-02", timeLabel: "2:00 PM – 4:00 PM" });
  });

  it("marks all-day when allDay is true on a day", () => {
    const rows = parseSubmissionScheduleRows({
      scheduleDays: [{ date: "2026-07-04", allDay: true }],
      eventDate: "2026-07-04",
      eventTime: "10:00",
      endDate: null,
      endTime: null,
      allDay: false,
    });
    expect(rows).toEqual([{ date: "2026-07-04", timeLabel: "All day" }]);
  });

  it("falls back to legacy fields when scheduleDays is empty array", () => {
    const rows = parseSubmissionScheduleRows({
      scheduleDays: [],
      eventDate: "2026-08-01",
      eventTime: "09:00",
      endDate: null,
      endTime: null,
      allDay: false,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].date).toBe("2026-08-01");
    expect(rows[0].timeLabel).toContain("9:00 AM");
  });

  it("uses legacy multi-day date range when endDate differs", () => {
    const rows = parseSubmissionScheduleRows({
      scheduleDays: null,
      eventDate: "2026-09-01",
      eventTime: "10:00",
      endDate: "2026-09-03",
      endTime: "11:00",
      allDay: false,
    });
    expect(rows[0].date).toBe("2026-09-01 – 2026-09-03");
  });
});

describe("getSubmissionCompletenessChecks", () => {
  it("flags missing optional fields", () => {
    const items = getSubmissionCompletenessChecks({
      eventDescription: null,
      imageUrl: null,
      venueCity: "",
      venueState: "WA",
      venueZip: "",
      marketId: null,
      tagIds: [],
      facebookUrl: null,
      instagramUrl: null,
      websiteUrl: null,
    });
    const byId = Object.fromEntries(items.map((i) => [i.id, i.ok]));
    expect(byId.description).toBe(false);
    expect(byId.image).toBe(false);
    expect(byId.address).toBe(false);
    expect(byId.market).toBe(false);
    expect(byId.tags).toBe(false);
    expect(byId.links).toBe(false);
  });

  it("marks items ok when populated", () => {
    const items = getSubmissionCompletenessChecks({
      eventDescription: "Hello",
      imageUrl: "https://example.com/a.jpg",
      venueCity: "Spokane",
      venueState: "WA",
      venueZip: "99201",
      marketId: "m1",
      tagIds: ["t1"],
      facebookUrl: null,
      instagramUrl: "https://instagram.com/x",
      websiteUrl: null,
    });
    expect(items.every((i) => i.ok)).toBe(true);
  });
});
