import { auth } from "@/auth";
import { db } from "@/lib/db";
import { syncEventToOccurrence } from "@/lib/services/event-sync";
import { eventSchema } from "@/lib/validations";
import { parseDateTimeInTimezone } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if ("error" in result && result.error) return result.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = eventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const { tagIds, featureIds, scheduleDays, ...data } = parsed.data;

  const tz = "America/Los_Angeles";

  let startDate = new Date(data.startDate);
  let endDate = new Date(data.endDate);

  if (scheduleDays?.length) {
    const first = scheduleDays[0];
    const last = scheduleDays[scheduleDays.length - 1];
    const firstStart = first.allDay ? "00:00" : (first.startTime ?? "00:00");
    const lastEnd = last.allDay ? "23:59" : (last.endTime ?? "23:59");
    startDate = parseDateTimeInTimezone(first.date, firstStart, tz);
    endDate = parseDateTimeInTimezone(last.date, lastEnd, tz);
  }

  let venueId = data.venueId?.trim() || null;
  if (!venueId && data.venueName?.trim() && data.venueAddress?.trim() && data.venueCity?.trim() && data.venueState?.trim() && data.venueZip?.trim()) {
    const lat =
      typeof data.venueLat === "number" && !Number.isNaN(data.venueLat)
        ? data.venueLat
        : 47.6588;
    const lng =
      typeof data.venueLng === "number" && !Number.isNaN(data.venueLng)
        ? data.venueLng
        : -117.426;
    const venue = await db.venue.create({
      data: {
        name: data.venueName.trim(),
        address: data.venueAddress.trim(),
        city: data.venueCity.trim(),
        state: data.venueState.trim(),
        zip: data.venueZip.trim(),
        lat,
        lng,
      },
    });
    venueId = venue.id;
  }

  if (!venueId) {
    return NextResponse.json(
      { error: { message: "Select a venue or enter an address" } },
      { status: 400 }
    );
  }

  const existing = await db.event.findUnique({
    where: { id },
    select: { status: true, submittedById: true, title: true, slug: true },
  });

  const event = await db.event.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      startDate,
      endDate,
      timezone: null,
      venueId,
      marketId: data.marketId || null,
      imageUrl: data.imageUrl || null,
      status: data.status,
      websiteUrl: data.websiteUrl || null,
      facebookUrl: data.facebookUrl || null,
      tags: { set: tagIds?.map((id) => ({ id })) ?? [] },
      features: { set: featureIds?.map((id) => ({ id })) ?? [] },
      ...(data.participationMode !== undefined && {
        participationMode: data.participationMode || null,
      }),
      ...(data.vendorCapacity !== undefined && {
        vendorCapacity: data.vendorCapacity,
      }),
      ...(data.publicIntentListEnabled !== undefined && {
        publicIntentListEnabled: data.publicIntentListEnabled,
      }),
      ...(data.publicIntentNamesEnabled !== undefined && {
        publicIntentNamesEnabled: data.publicIntentNamesEnabled,
      }),
      ...(data.publicRosterEnabled !== undefined && {
        publicRosterEnabled: data.publicRosterEnabled,
      }),
    },
  });

  await db.eventScheduleDay.deleteMany({ where: { eventId: id } });
  if (scheduleDays?.length) {
    await db.eventScheduleDay.createMany({
      data: scheduleDays.map((d) => ({
        eventId: id,
        date: new Date(d.date),
        startTime: d.allDay ? "00:00" : (d.startTime ?? "00:00"),
        endTime: d.allDay ? "23:59" : (d.endTime ?? "23:59"),
        allDay: d.allDay,
      })),
    });
  }

  syncEventToOccurrence(id).catch((err) =>
    console.error("syncEventToOccurrence failed:", err)
  );

  if (existing?.submittedById && data.status !== existing.status) {
    const prefs = await db.notificationPreference.findUnique({
      where: { userId: existing.submittedById },
    });
    if (prefs?.organizerAlertsEnabled !== false) {
      if (data.status === "PUBLISHED") {
        await createNotification(
          existing.submittedById,
          "EVENT_PUBLISHED",
          "Your event is now published",
          `"${event.title}" is now live and visible to visitors.`,
          `/events/${event.slug}`
        );
      } else if (data.status === "REJECTED") {
        await createNotification(
          existing.submittedById,
          "EVENT_REJECTED",
          "Your event was not approved",
          `"${event.title}" was not approved for publication.`,
          `/organizer/events/${event.id}/edit`
        );
      }
    }
  }

  return NextResponse.json(event);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if ("error" in result && result.error) return result.error;

  const { id } = await params;
  await db.event.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
