import type { Prisma } from "@prisma/client";

export const ORGANIZER_MANAGE_ROLES = ["OWNER", "MANAGER"] as const;

export function organizerManageMarketWhere(userId: string): Prisma.MarketWhereInput {
  return {
    OR: [
      { ownerId: userId },
      {
        memberships: {
          some: {
            userId,
            role: { in: [...ORGANIZER_MANAGE_ROLES] },
          },
        },
      },
    ],
  };
}

export function organizerAnyMarketWhere(userId: string): Prisma.MarketWhereInput {
  return {
    OR: [
      { ownerId: userId },
      {
        memberships: {
          some: { userId },
        },
      },
    ],
  };
}

export function organizerManageEventWhere(userId: string): Prisma.EventWhereInput {
  return {
    OR: [
      { submittedById: userId },
      { market: organizerManageMarketWhere(userId) },
    ],
  };
}
