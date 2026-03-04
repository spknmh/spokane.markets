import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { vendorIntentSchema } from "@/lib/validations";

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

    const body = await _request.json();
    const parsed = vendorIntentSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { status, visibility, notes } = parsed.data;

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
        status,
        visibility: visibility ?? "PRIVATE",
        notes: notes ?? null,
      },
      update: {
        status,
        visibility: visibility ?? undefined,
        notes: notes ?? undefined,
      },
    });

    return NextResponse.json(intent, { status: 201 });
  } catch (err) {
    console.error("Intent POST error:", err);
    return NextResponse.json(
      { error: "Failed to update intent" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const existing = await db.eventVendorIntent.findUnique({
      where: {
        eventId_vendorProfileId: {
          eventId,
          vendorProfileId: profile.id,
        },
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "No intent found for this event" },
        { status: 404 }
      );
    }

    await db.eventVendorIntent.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Intent DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to remove intent" },
      { status: 500 }
    );
  }
}
