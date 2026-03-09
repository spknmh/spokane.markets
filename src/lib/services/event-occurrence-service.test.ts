import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    event: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

describe("EventOccurrenceService", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFindUnique.mockReset();
    mockFindFirst.mockReset();
  });

  it("findEventBySlug uses db.event", async () => {
    const mockEvent = {
      id: "ev1",
      slug: "test-event",
      title: "Test",
      venue: { name: "Venue" },
      market: null,
      tags: [],
      features: [],
      scheduleDays: [],
      attendances: [],
      vendorRoster: [],
      vendorIntents: [],
    };
    mockFindUnique.mockResolvedValue(mockEvent);

    const { findEventBySlug } = await import("./event-occurrence-service");
    const result = await findEventBySlug("test-event");

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "test-event" },
        include: expect.any(Object),
      })
    );
    expect(result).toEqual(mockEvent);
  });
});
