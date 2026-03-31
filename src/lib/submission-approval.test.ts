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
      eventDescription: "Desc",
      imageUrl: null,
      websiteUrl: null,
      facebookUrl: null,
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
    expect(data.scheduleDays).toBeUndefined();
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
