import { auth } from "@/auth";
import { db } from "@/lib/db";
import { eventSchema } from "@/lib/validations";
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

  let startDate = new Date(data.startDate);
  let endDate = new Date(data.endDate);

  if (scheduleDays?.length) {
    const first = scheduleDays[0];
    const last = scheduleDays[scheduleDays.length - 1];
    const firstStart = first.allDay ? "00:00" : (first.startTime ?? "00:00");
    const firstEnd = first.allDay ? "23:59" : (first.endTime ?? "23:59");
    const lastStart = last.allDay ? "00:00" : (last.startTime ?? "00:00");
    const lastEnd = last.allDay ? "23:59" : (last.endTime ?? "23:59");
    startDate = new Date(`${first.date}T${firstStart}:00`);
    endDate = new Date(`${last.date}T${lastEnd}:00`);
  }

  const event = await db.event.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      startDate,
      endDate,
      timezone: data.timezone || null,
      venueId: data.venueId,
      marketId: data.marketId || null,
      imageUrl: data.imageUrl || null,
      status: data.status,
      websiteUrl: data.websiteUrl || null,
      facebookUrl: data.facebookUrl || null,
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
