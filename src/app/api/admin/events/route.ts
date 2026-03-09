import { auth } from "@/auth";
import { db } from "@/lib/db";
import { syncEventToOccurrence } from "@/lib/services/event-sync";
import { eventSchema } from "@/lib/validations";
import { parseDateTimeInTimezone } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    const firstEnd = first.allDay ? "23:59" : (first.endTime ?? "23:59");
    const lastStart = last.allDay ? "00:00" : (last.startTime ?? "00:00");
    const lastEnd = last.allDay ? "23:59" : (last.endTime ?? "23:59");
    startDate = parseDateTimeInTimezone(first.date, firstStart, tz);
    endDate = parseDateTimeInTimezone(last.date, lastEnd, tz);
  }

  let venueId = data.venueId?.trim() || null;
  if (!venueId && data.venueName?.trim() && data.venueAddress?.trim() && data.venueCity?.trim() && data.venueState?.trim() && data.venueZip?.trim()) {
    const venue = await db.venue.create({
      data: {
        name: data.venueName.trim(),
        address: data.venueAddress.trim(),
        city: data.venueCity.trim(),
        state: data.venueState.trim(),
        zip: data.venueZip.trim(),
        lat: 47.6588,
        lng: -117.426,
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

  const event = await db.event.create({
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
      ...(data.participationMode && { participationMode: data.participationMode }),
      ...(data.vendorCapacity != null && { vendorCapacity: data.vendorCapacity }),
      ...(data.publicIntentListEnabled !== undefined && {
        publicIntentListEnabled: data.publicIntentListEnabled,
      }),
      ...(data.publicIntentNamesEnabled !== undefined && {
        publicIntentNamesEnabled: data.publicIntentNamesEnabled,
      }),
      ...(data.publicRosterEnabled !== undefined && {
        publicRosterEnabled: data.publicRosterEnabled,
      }),
      tags: tagIds?.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
      features: featureIds?.length
        ? { connect: featureIds.map((id) => ({ id })) }
        : undefined,
    },
  });

  if (scheduleDays?.length) {
    await db.eventScheduleDay.createMany({
      data: scheduleDays.map((d) => ({
        eventId: event.id,
        date: new Date(d.date),
        startTime: d.allDay ? "00:00" : (d.startTime ?? "00:00"),
        endTime: d.allDay ? "23:59" : (d.endTime ?? "23:59"),
        allDay: d.allDay,
      })),
    });
  }

  syncEventToOccurrence(event.id).catch((err) =>
    console.error("syncEventToOccurrence failed:", err)
  );

  return NextResponse.json(event, { status: 201 });
}
