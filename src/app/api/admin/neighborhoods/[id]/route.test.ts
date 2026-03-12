import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireApiAdminMock, dbMock } = vi.hoisted(() => ({
  requireApiAdminMock: vi.fn(),
  dbMock: {
    neighborhood: { findUnique: vi.fn() },
    venue: { count: vi.fn() },
    market: { count: vi.fn() },
    subscriber: { count: vi.fn() },
    savedFilter: { count: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/api-auth", () => ({
  requireApiAdmin: requireApiAdminMock,
}));
vi.mock("@/lib/db", () => ({
  db: dbMock,
}));

import { DELETE } from "./route";

describe("DELETE /api/admin/neighborhoods/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiAdminMock.mockResolvedValue({ error: null });
    dbMock.neighborhood.findUnique.mockResolvedValue({ id: "n1", slug: "downtown" });
  });

  it("returns 409 when neighborhood is in use and no reassignment is provided", async () => {
    dbMock.venue.count.mockResolvedValue(2);
    dbMock.market.count.mockResolvedValue(1);
    dbMock.subscriber.count.mockResolvedValue(3);
    dbMock.savedFilter.count.mockResolvedValue(4);

    const response = await DELETE(
      new Request("http://localhost/api/admin/neighborhoods/n1", {
        method: "DELETE",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "n1" }) }
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.usage).toEqual({
      venues: 2,
      markets: 1,
      subscribers: 3,
      savedFilters: 4,
    });
  });

  it("deletes when neighborhood is unused", async () => {
    dbMock.venue.count.mockResolvedValue(0);
    dbMock.market.count.mockResolvedValue(0);
    dbMock.subscriber.count.mockResolvedValue(0);
    dbMock.savedFilter.count.mockResolvedValue(0);

    const tx = {
      neighborhood: { delete: vi.fn().mockResolvedValue(null) },
    };
    dbMock.$transaction.mockImplementation(async (callback: (txClient: typeof tx) => Promise<void>) =>
      callback(tx)
    );

    const response = await DELETE(
      new Request("http://localhost/api/admin/neighborhoods/n1", {
        method: "DELETE",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "n1" }) }
    );

    expect(response.status).toBe(204);
    expect(tx.neighborhood.delete).toHaveBeenCalledWith({ where: { id: "n1" } });
  });

  it("reassigns related records and deletes", async () => {
    dbMock.venue.count.mockResolvedValue(1);
    dbMock.market.count.mockResolvedValue(1);
    dbMock.subscriber.count.mockResolvedValue(1);
    dbMock.savedFilter.count.mockResolvedValue(1);

    const tx = {
      neighborhood: {
        findUnique: vi.fn().mockResolvedValue({ id: "n2" }),
        delete: vi.fn().mockResolvedValue(null),
      },
      venue: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      market: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      subscriber: {
        findMany: vi.fn().mockResolvedValue([{ id: "s1", areas: ["downtown"] }]),
        update: vi.fn().mockResolvedValue(null),
      },
      savedFilter: {
        findMany: vi.fn().mockResolvedValue([{ id: "f1", neighborhoods: ["downtown"] }]),
        update: vi.fn().mockResolvedValue(null),
      },
    };
    dbMock.$transaction.mockImplementation(async (callback: (txClient: typeof tx) => Promise<void>) =>
      callback(tx)
    );

    const response = await DELETE(
      new Request("http://localhost/api/admin/neighborhoods/n1", {
        method: "DELETE",
        body: JSON.stringify({ reassignToSlug: "south-hill" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "n1" }) }
    );

    expect(response.status).toBe(204);
    expect(tx.venue.updateMany).toHaveBeenCalled();
    expect(tx.market.updateMany).toHaveBeenCalled();
    expect(tx.subscriber.update).toHaveBeenCalled();
    expect(tx.savedFilter.update).toHaveBeenCalled();
    expect(tx.neighborhood.delete).toHaveBeenCalledWith({ where: { id: "n1" } });
  });
});
