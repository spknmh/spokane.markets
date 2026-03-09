import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { findEventByIdOrSlug } from "@/lib/services/event-occurrence-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getParticipationConfig } from "@/lib/participation-config";
import { createNotification } from "@/lib/notifications";

async function findEvent(eventIdOrSlug: string) {
  return findEventByIdOrSlug(eventIdOrSlug);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ok, retryAfter } = checkRateLimit(session.user.id, "vendorIntents");
    if (!ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
      );
    }

    const profile = await db.vendorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) {
      return NextResponse.json(
        { error: "No vendor profile found" },
        { status: 404 }
      );
    }

    const { eventId: eventIdOrSlug } = await params;

    const event = await findEvent(eventIdOrSlug);
    if (!event || event.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Event not found or not published" },
        { status: 404 }
      );
    }

    const config = getParticipationConfig(event);
    if (config.mode !== "REQUEST_TO_JOIN" && config.mode !== "CAPACITY_LIMITED") {
      return NextResponse.json(
        { error: "This event does not accept roster requests" },
        { status: 400 }
      );
    }

    const intent = await db.eventVendorIntent.upsert({
      where: {
        eventId_vendorProfileId: {
          eventId: event.id,
          vendorProfileId: profile.id,
        },
      },
      create: {
        eventId: event.id,
        vendorProfileId: profile.id,
        status: "REQUESTED",
        visibility: "PRIVATE",
      },
      update: {
        status: "REQUESTED",
        visibility: "PRIVATE",
      },
    });

    const organizerIds = new Set<string>();
    if (event.submittedById) organizerIds.add(event.submittedById);
    if (event.market?.ownerId) organizerIds.add(event.market.ownerId);

    for (const organizerId of organizerIds) {
      const prefs = await db.notificationPreference.findUnique({
        where: { userId: organizerId },
      });
      const allowVendorRequests =
        prefs?.vendorRequestAlertsEnabled ?? prefs?.organizerAlertsEnabled ?? true;
      if (!allowVendorRequests) continue;

      await createNotification(
        organizerId,
        "VENDOR_ROSTER_REQUEST",
        `${profile.businessName} requested to join`,
        `${profile.businessName} requested to be listed as a vendor for ${event.title}.`,
        `/organizer/events/${event.id}/roster`
      );
    }

    return NextResponse.json(intent, { status: 201 });
  } catch (err) {
    console.error("Request roster POST error:", err);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
