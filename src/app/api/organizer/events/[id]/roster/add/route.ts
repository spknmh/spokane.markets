import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canManageEventRoster } from "@/lib/organizer-guard";
import { getParticipationConfig } from "@/lib/participation-config";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;

    const event = await db.event.findUnique({
      where: { id: eventId },
      include: { market: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!canManageEventRoster(session.user.id, event, session.user.role ?? undefined)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const vendorId = body.vendorId as string | undefined;
    const status = (body.status as "INVITED" | "ACCEPTED" | "CONFIRMED") ?? "CONFIRMED";
    if (!vendorId) {
      return NextResponse.json(
        { error: "vendorId is required" },
        { status: 400 }
      );
    }

    const config = getParticipationConfig(event);
    if (config.vendorCapacity != null) {
      const currentCount = await db.eventVendorRoster.count({
        where: {
          eventId,
          status: { in: ["INVITED", "ACCEPTED", "CONFIRMED"] },
        },
      });
      if (currentCount >= config.vendorCapacity) {
        return NextResponse.json(
          { error: "Event is at capacity" },
          { status: 409 }
        );
      }
    }

    const roster = await db.eventVendorRoster.upsert({
      where: {
        eventId_vendorProfileId: { eventId, vendorProfileId: vendorId },
      },
      create: {
        eventId,
        vendorProfileId: vendorId,
        status,
        approvedByUserId: session.user.id,
        approvedAt: new Date(),
      },
      update: {
        status,
        approvedByUserId: session.user.id,
        approvedAt: new Date(),
      },
    });

    await logAudit(
      session.user.id,
      "ROSTER_ADD",
      "EVENT_VENDOR_ROSTER",
      roster.id,
      { vendorId, eventId }
    );

    const [vendor, favorites] = await Promise.all([
      db.vendorProfile.findUnique({
        where: { id: vendorId },
        select: { businessName: true, slug: true },
      }),
      db.favoriteVendor.findMany({
        where: { vendorProfileId: vendorId },
        include: {
          user: {
            select: {
              id: true,
              notificationPreference: true,
            },
          },
        },
      }),
    ]);

    if (vendor) {
      for (const fav of favorites) {
        const prefs = fav.user.notificationPreference;
        if (prefs?.favoriteVendorEnabled === false) continue;
        if (prefs?.emailsPausedAt) continue;

        await createNotification(
          fav.user.id,
          "FAVORITE_VENDOR_EVENT",
          `${vendor.businessName} is at ${event.title}`,
          `A vendor you follow will be at ${event.title}.`,
          `/events/${event.slug}`
        );
      }
    }

    return NextResponse.json(roster);
  } catch (err) {
    console.error("Roster add error:", err);
    return NextResponse.json(
      { error: "Failed to add vendor" },
      { status: 500 }
    );
  }
}
