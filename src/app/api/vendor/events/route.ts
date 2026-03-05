import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getParticipationConfig } from "@/lib/participation-config";
import { sendVendorFavoriteAlerts } from "@/lib/vendor-alerts";
import { evaluateAndGrantBadges } from "@/lib/badges";
import { vendorEventsSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.vendorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) {
      return NextResponse.json(
        { error: "No vendor profile found" },
        { status: 404 },
      );
    }

    const vendorEvents = await db.vendorEvent.findMany({
      where: { vendorProfileId: profile.id },
      include: {
        event: {
          include: { venue: true, tags: true, features: true },
        },
      },
      orderBy: { event: { startDate: "asc" } },
    });

    const upcoming = vendorEvents.filter(
      (ve) =>
        ve.event.startDate >= new Date() &&
        ve.event.status === "PUBLISHED",
    );

    return NextResponse.json(upcoming);
  } catch (err) {
    console.error("Vendor events GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch vendor events" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.vendorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) {
      return NextResponse.json(
        { error: "No vendor profile found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = vendorEventsSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const { eventId } = parsed.data;

    const event = await db.event.findUnique({
      where: { id: eventId },
      include: { market: true },
    });
    if (!event || event.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Event not found or not published" },
        { status: 404 },
      );
    }

    const config = getParticipationConfig(event);
    if (config.mode === "INVITE_ONLY") {
      return NextResponse.json(
        { error: "This event is invite-only. Organizers add vendors." },
        { status: 400 },
      );
    }

    const existing = await db.vendorEvent.findUnique({
      where: {
        vendorProfileId_eventId: {
          vendorProfileId: profile.id,
          eventId,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Already linked to this event" },
        { status: 409 },
      );
    }

    const vendorEvent = await db.vendorEvent.create({
      data: {
        vendorProfileId: profile.id,
        eventId,
      },
    });

    sendVendorFavoriteAlerts(profile.id, eventId);
    evaluateAndGrantBadges(session.user.id).catch(() => {});

    return NextResponse.json(vendorEvent, { status: 201 });
  } catch (err) {
    console.error("Vendor events POST error:", err);
    return NextResponse.json(
      { error: "Failed to link vendor to event" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.vendorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) {
      return NextResponse.json(
        { error: "No vendor profile found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { eventId } = body as { eventId?: string };

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 },
      );
    }

    const existing = await db.vendorEvent.findUnique({
      where: {
        vendorProfileId_eventId: {
          vendorProfileId: profile.id,
          eventId,
        },
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Not linked to this event" },
        { status: 404 },
      );
    }

    await db.vendorEvent.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Vendor events DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to unlink vendor from event" },
      { status: 500 },
    );
  }
}
