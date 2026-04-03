import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Submission } from "@prisma/client";

const { findFirstMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    event: { findFirst: findFirstMock },
  },
}));

import {
  buildEventDataFromSubmission,
  ensureUniqueEventSlug,
  submissionHasCompleteVenueForEvent,
} from "./submission-approval";

describe("buildEventDataFromSubmission", () => {
  it("maps a single-day submission to EventData", () => {
    const sub = {
      eventTitle: "Test Event",
      eventDate: "2026-07-04",
      eventTime: "14:00",
      endDate: null,
      endTime: null,
      allDay: false,
      scheduleDays: null,
      eventDescription: "Desc",
      imageUrl: null,
      websiteUrl: null,
      facebookUrl: null,
      instagramUrl: "https://instagram.com/myevent",
      marketId: null,
      tagIds: [],
      featureIds: [],
      venueName: "Venue",
      venueAddress: "1 St",
      venueCity: "Spokane",
      venueState: "WA",
      venueZip: "99201",
    } as unknown as Submission;

    const data = buildEventDataFromSubmission(sub, "test-event");
    expect(data.title).toBe("Test Event");
    expect(data.slug).toBe("test-event");
    expect(data.venueCity).toBe("Spokane");
    expect(data.instagramUrl).toBe("https://instagram.com/myevent");
    expect(data.scheduleDays).toBeUndefined();
  });

  it("uses scheduleDays JSON when present", () => {
    const sub = {
      eventTitle: "Multi",
      eventDate: "2026-07-01",
      eventTime: "09:00",
      endDate: "2026-07-02",
      endTime: "17:00",
      allDay: false,
      scheduleDays: [
        { date: "2026-07-01", allDay: false, startTime: "09:00", endTime: "17:00" },
        { date: "2026-07-02", allDay: false, startTime: "09:00", endTime: "17:00" },
      ],
      eventDescription: null,
      imageUrl: null,
      websiteUrl: null,
      facebookUrl: null,
      instagramUrl: null,
      marketId: null,
      tagIds: [],
      featureIds: [],
      venueName: "Hall",
      venueAddress: "1 St",
      venueCity: "Spokane",
      venueState: "WA",
      venueZip: "99201",
    } as unknown as Submission;

    const data = buildEventDataFromSubmission(sub, "multi");
    expect(data.scheduleDays?.length).toBe(2);
    expect(data.scheduleDays?.[0].date).toBe("2026-07-01");
  });
});

describe("submissionHasCompleteVenueForEvent", () => {
  const base = {
    venueName: "Hall",
    venueAddress: "1 St",
    venueCity: "Spokane",
    venueState: "WA",
    venueZip: "99201",
  } as unknown as Submission;

  it("returns true when all venue fields are non-empty", () => {
    expect(submissionHasCompleteVenueForEvent(base)).toBe(true);
  });

  it("returns false when zip is missing", () => {
    expect(
      submissionHasCompleteVenueForEvent({
        ...base,
        venueZip: "",
      } as Submission),
    ).toBe(false);
  });
});

describe("ensureUniqueEventSlug", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
  });

  it("returns base slug when unused", async () => {
    findFirstMock.mockResolvedValue(null);
    const slug = await ensureUniqueEventSlug("My Great Event!");
    expect(slug).toBe("my-great-event");
    expect(findFirstMock).toHaveBeenCalled();
  });

  it("appends suffix when slug exists", async () => {
    findFirstMock
      .mockResolvedValueOnce({ id: "e1" })
      .mockResolvedValueOnce(null);
    const slug = await ensureUniqueEventSlug("Hello");
    expect(slug).toBe("hello-1");
  });
});
