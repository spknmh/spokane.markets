/**
 * Event service: unified access to events via legacy events table.
 */

import { db } from "@/lib/db";
import type {
  Event,
  Venue,
  Market,
  EventScheduleDay,
  EventVendorRoster,
  EventVendorIntent,
  VerificationStatus,
} from "@prisma/client";

/** Event-like shape consumed by pages and components (venue, market, roster, intents, attendance count). */
export type EventForDisplay = Event & {
  venue: Venue;
  market: Market | null;
  tags: { id: string; name: string; slug: string }[];
  features: { id: string; name: string; slug: string; icon: string | null }[];
  scheduleDays: EventScheduleDay[];
  _count: { attendances: number };
  userAttendance?: { id: string; userId: string; eventId: string; status: string } | null;
  vendorRoster: (EventVendorRoster & {
    vendorProfile: {
      id: string;
      businessName: string;
      slug: string;
      imageUrl: string | null;
      imageFocalX: number;
      imageFocalY: number;
      specialties: string | null;
      verificationStatus: VerificationStatus;
    };
  })[];
  vendorIntents: (EventVendorIntent & {
    vendorProfile: {
      id: string;
      businessName: string;
      slug: string;
      imageUrl: string | null;
      imageFocalX: number;
      imageFocalY: number;
      specialties: string | null;
      verificationStatus: VerificationStatus;
    };
  })[];
};

/**
 * Find event by slug.
 */
export async function findEventBySlug(slug: string, userId?: string): Promise<EventForDisplay | null> {
  const event = await db.event.findFirst({
    where: { slug, deletedAt: null },
    include: {
      venue: true,
      market: true,
      tags: true,
      features: true,
      scheduleDays: { orderBy: { date: "asc" } },
      _count: { select: { attendances: true } },
      vendorRoster: {
        where: { status: { in: ["INVITED", "ACCEPTED", "CONFIRMED"] } },
        include: {
          vendorProfile: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              imageUrl: true,
              imageFocalX: true,
              imageFocalY: true,
              specialties: true,
              verificationStatus: true,
            },
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
            select: {
              id: true,
              businessName: true,
              slug: true,
              imageUrl: true,
              imageFocalX: true,
              imageFocalY: true,
              specialties: true,
              verificationStatus: true,
            },
          },
        },
      },
    },
  });

  if (!event) return null;

  let userAttendance = null;
  if (userId) {
    userAttendance = await db.attendance.findUnique({
      where: { userId_eventId: { userId, eventId: event.id } },
      select: { id: true, userId: true, eventId: true, status: true },
    });
  }

  return { ...event, userAttendance } as EventForDisplay;
}

/**
 * Find event by id or slug (for API routes that accept either).
 */
export async function findEventByIdOrSlug(idOrSlug: string, userId?: string): Promise<EventForDisplay | null> {
  const event = await db.event.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], deletedAt: null },
    include: {
      venue: true,
      market: true,
      tags: true,
      features: true,
      scheduleDays: { orderBy: { date: "asc" } },
      _count: { select: { attendances: true } },
      vendorRoster: {
        where: { status: { in: ["INVITED", "ACCEPTED", "CONFIRMED"] } },
        include: {
          vendorProfile: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              imageUrl: true,
              imageFocalX: true,
              imageFocalY: true,
              specialties: true,
              verificationStatus: true,
            },
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
            select: {
              id: true,
              businessName: true,
              slug: true,
              imageUrl: true,
              imageFocalX: true,
              imageFocalY: true,
              specialties: true,
              verificationStatus: true,
            },
          },
        },
      },
    },
  });

  if (!event) return null;

  let userAttendance = null;
  if (userId) {
    userAttendance = await db.attendance.findUnique({
      where: { userId_eventId: { userId, eventId: event.id } },
      select: { id: true, userId: true, eventId: true, status: true },
    });
  }

  return { ...event, userAttendance } as EventForDisplay;
}
