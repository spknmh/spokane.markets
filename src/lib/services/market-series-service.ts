/**
 * Market service: unified access to markets via legacy markets table.
 */

import { db } from "@/lib/db";
import type { Market, Venue, Event, Neighborhood } from "@prisma/client";

/** Market-like shape with venue and events. */
export type MarketForDisplay = Market & {
  baseAreaRef: Neighborhood | null;
  venue: Venue;
  events: (Event & { venue: Venue })[];
};

/**
 * Find market by slug.
 */
export async function findMarketBySlug(slug: string): Promise<MarketForDisplay | null> {
  return db.market.findFirst({
    where: { slug, deletedAt: null },
    include: {
      baseAreaRef: true,
      venue: true,
      events: {
        where: { status: "PUBLISHED", startDate: { gte: new Date() }, deletedAt: null },
        orderBy: { startDate: "asc" },
        take: 10,
        include: { venue: true },
      },
    },
  }) as Promise<MarketForDisplay | null>;
}
