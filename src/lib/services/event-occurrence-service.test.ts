import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    event: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

describe("EventOccurrenceService", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFindFirst.mockReset();
  });

  it("findEventBySlug uses db.event", async () => {
    const mockDbResult = {
      id: "ev1",
      slug: "test-event",
      title: "Test",
      venue: { name: "Venue" },
      market: null,
      tags: [],
      features: [],
      scheduleDays: [],
      _count: { attendances: 0 },
      vendorRoster: [],
      vendorIntents: [],
      vendorEvents: [],
    };
    mockFindFirst.mockResolvedValue(mockDbResult);

    const { findEventBySlug } = await import("./event-occurrence-service");
    const result = await findEventBySlug("test-event");

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "test-event", deletedAt: null },
        include: expect.any(Object),
      })
    );
    expect(result).toEqual({ ...mockDbResult, userAttendance: null });
  });
});
