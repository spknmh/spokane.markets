import { auth } from "@/auth";
import { db } from "@/lib/db";
import { organizerEventSchema } from "@/lib/validations";
import { parseDateTimeInTimezone } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = organizerEventSchema.safeParse(body);
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

  const hasVerifiedMarket = await db.market.findFirst({
    where: { ownerId: session.user.id, verificationStatus: "VERIFIED" },
    select: { id: true },
  });

  const status = hasVerifiedMarket ? "PUBLISHED" : "PENDING";

  const event = await db.event.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      startDate,
      endDate,
      timezone: null,
      venueId: data.venueId,
      marketId: data.marketId || null,
      imageUrl: data.imageUrl || null,
      websiteUrl: data.websiteUrl || null,
      facebookUrl: data.facebookUrl || null,
      status,
      submittedById: session.user.id,
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

  return NextResponse.json(event, { status: 201 });
}
