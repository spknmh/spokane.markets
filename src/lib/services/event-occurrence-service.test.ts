import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    event: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    eventOccurrence: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    attendance: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

describe("EventOccurrenceService", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.USE_NEW_MODELS = "false";
    mockFindUnique.mockReset();
    mockFindFirst.mockReset();
    mockFindMany.mockReset();
  });

  it("useNewModels returns false when USE_NEW_MODELS is not 'true'", async () => {
    process.env.USE_NEW_MODELS = "false";
    const { useNewModels } = await import("./event-occurrence-service");
    expect(useNewModels()).toBe(false);
  });

  it("useNewModels returns true when USE_NEW_MODELS is 'true'", async () => {
    process.env.USE_NEW_MODELS = "true";
    const { useNewModels } = await import("./event-occurrence-service");
    expect(useNewModels()).toBe(true);
  });

  it("findEventBySlug uses db.event when USE_NEW_MODELS is false", async () => {
    process.env.USE_NEW_MODELS = "false";
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
