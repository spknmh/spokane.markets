/**
 * Event service: unified access to events via legacy events table.
 */

import { db } from "@/lib/db";
import type { Event, Venue, Market, EventScheduleDay, EventVendorRoster, EventVendorIntent } from "@prisma/client";

/** Event-like shape consumed by pages and components (venue, market, roster, intents, attendances). */
export type EventForDisplay = Event & {
  venue: Venue;
  market: Market | null;
  tags: { id: string; name: string; slug: string }[];
  features: { id: string; name: string; slug: string; icon: string | null }[];
  scheduleDays: EventScheduleDay[];
  attendances: { id: string; userId: string; eventId: string; status: string }[];
  vendorRoster: (EventVendorRoster & {
    vendorProfile: { id: string; businessName: string; slug: string; imageUrl: string | null; specialties: string | null };
  })[];
  vendorIntents: (EventVendorIntent & {
    vendorProfile: { id: string; businessName: string; slug: string; imageUrl: string | null; specialties: string | null };
  })[];
};

/**
 * Find event by slug.
 */
export async function findEventBySlug(slug: string): Promise<EventForDisplay | null> {
  return db.event.findUnique({
    where: { slug },
    include: {
      venue: true,
      market: true,
      tags: true,
      features: true,
      scheduleDays: { orderBy: { date: "asc" } },
      attendances: true,
      vendorRoster: {
        where: { status: { in: ["INVITED", "ACCEPTED", "CONFIRMED"] } },
        include: {
          vendorProfile: {
            select: { id: true, businessName: true, slug: true, imageUrl: true, specialties: true },
          },
        },
      },
      vendorIntents: {
        where: {
          status: { in: ["ATTENDING", "INTERESTED"] },
          visibility: "PUBLIC",
        },
        include: {
          vendorProfile: {
            select: { id: true, businessName: true, slug: true, imageUrl: true, specialties: true },
          },
        },
      },
    },
  }) as Promise<EventForDisplay | null>;
}

/**
 * Find event by id or slug (for API routes that accept either).
 */
export async function findEventByIdOrSlug(idOrSlug: string): Promise<EventForDisplay | null> {
  return db.event.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: {
      venue: true,
      market: true,
      tags: true,
      features: true,
      scheduleDays: { orderBy: { date: "asc" } },
      attendances: true,
      vendorRoster: {
        where: { status: { in: ["INVITED", "ACCEPTED", "CONFIRMED"] } },
        include: {
          vendorProfile: {
            select: { id: true, businessName: true, slug: true, imageUrl: true, specialties: true },
          },
        },
      },
      vendorIntents: {
        where: {
          status: { in: ["ATTENDING", "INTERESTED"] },
          visibility: "PUBLIC",
        },
        include: {
          vendorProfile: {
            select: { id: true, businessName: true, slug: true, imageUrl: true, specialties: true },
          },
        },
      },
    },
  }) as Promise<EventForDisplay | null>;
}
