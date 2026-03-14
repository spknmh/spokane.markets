import { describe, expect, it } from "vitest";
import {
  organizerAnyMarketWhere,
  organizerManageEventWhere,
  organizerManageMarketWhere,
} from "./market-membership";

describe("market membership query helpers", () => {
  it("builds organizer market-manage filter with owner and membership checks", () => {
    const where = organizerManageMarketWhere("user_123");
    expect(where).toMatchObject({
      OR: [
        { ownerId: "user_123" },
        {
          memberships: {
            some: {
              userId: "user_123",
              role: { in: ["OWNER", "MANAGER"] },
            },
          },
        },
      ],
    });
  });

  it("builds organizer any-market filter including non-manager memberships", () => {
    const where = organizerAnyMarketWhere("user_abc");
    expect(where).toMatchObject({
      OR: [
        { ownerId: "user_abc" },
        { memberships: { some: { userId: "user_abc" } } },
      ],
    });
  });

  it("builds organizer event-manage filter using market manage checks", () => {
    const where = organizerManageEventWhere("user_123");
    expect(where).toMatchObject({
      OR: [
        { submittedById: "user_123" },
        {
          market: {
            OR: expect.any(Array),
          },
        },
      ],
    });
  });
});
