import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getParticipationConfig } from "@/lib/participation-config";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: eventId } = await params;

    const event = await db.event.findUnique({
      where: { id: eventId },
      include: { market: true },
    });
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
          eventId,
          vendorProfileId: profile.id,
        },
      },
      create: {
        eventId,
        vendorProfileId: profile.id,
        status: "REQUESTED",
        visibility: "PRIVATE",
      },
      update: {
        status: "REQUESTED",
        visibility: "PRIVATE",
      },
    });

    return NextResponse.json(intent, { status: 201 });
  } catch (err) {
    console.error("Request roster POST error:", err);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
