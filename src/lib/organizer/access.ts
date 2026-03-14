import { db } from "@/lib/db";

export async function canManageMarket(userId: string, marketId: string): Promise<boolean> {
  const managed = await db.market.findFirst({
    where: {
      id: marketId,
      OR: [
        { ownerId: userId },
        {
          memberships: {
            some: {
              userId,
              role: { in: ["OWNER", "MANAGER"] },
            },
          },
        },
      ],
    },
    select: { id: true },
  });
  return Boolean(managed);
}

export async function canManageEventViaMarketMembership(
  userId: string,
  eventId: string
): Promise<boolean> {
  const managed = await db.event.findFirst({
    where: {
      id: eventId,
      OR: [
        { submittedById: userId },
        {
          market: {
            OR: [
              { ownerId: userId },
              {
                memberships: {
                  some: {
                    userId,
                    role: { in: ["OWNER", "MANAGER"] },
                  },
                },
              },
            ],
          },
        },
      ],
    },
    select: { id: true },
  });
  return Boolean(managed);
}
