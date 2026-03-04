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
    if (!vendorId) {
      return NextResponse.json(
        { error: "vendorId is required" },
        { status: 400 }
      );
    }

    const config = getParticipationConfig(event);
    if (config.mode === "INVITE_ONLY") {
      return NextResponse.json(
        { error: "Use add endpoint for invite-only events" },
        { status: 400 }
      );
    }

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
        status: "CONFIRMED",
        approvedByUserId: session.user.id,
        approvedAt: new Date(),
      },
      update: {
        status: "CONFIRMED",
        approvedByUserId: session.user.id,
        approvedAt: new Date(),
      },
    });

    await db.eventVendorIntent.updateMany({
      where: {
        eventId,
        vendorProfileId: vendorId,
        status: { in: ["REQUESTED", "APPLIED"] },
      },
      data: { status: "DECLINED" },
    });

    const vendorProfile = await db.vendorProfile.findUnique({
      where: { id: vendorId },
      select: { userId: true },
    });
    if (vendorProfile?.userId) {
      await createNotification(
        vendorProfile.userId,
        "ROSTER_APPROVED",
        "You've been approved for the event",
        `Your request to be listed as a vendor has been approved.`,
        `/events/${event.slug}`
      );
    }

    await logAudit(
      session.user.id,
      "ROSTER_APPROVE",
      "EVENT_VENDOR_ROSTER",
      roster.id,
      { vendorId, eventId }
    );

    return NextResponse.json(roster);
  } catch (err) {
    console.error("Roster approve error:", err);
    return NextResponse.json(
      { error: "Failed to approve vendor" },
      { status: 500 }
    );
  }
}
