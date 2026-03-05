import { auth } from "@/auth";
import { db } from "@/lib/db";
import { organizerEventSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

async function requireOrganizerAuth() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireOrganizerAuth();
  if ("error" in result && result.error) return result.error;
  const { session } = result as { session: NonNullable<typeof result.session> };

  const { id } = await params;

  const event = await db.event.findUnique({
    where: { id },
    select: { submittedById: true, status: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (event.submittedById !== session.user.id && session.user.role !== "ADMIN") {
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

  let startDate = new Date(data.startDate);
  let endDate = new Date(data.endDate);

  if (scheduleDays?.length) {
    const first = scheduleDays[0];
    const last = scheduleDays[scheduleDays.length - 1];
    const firstStart = first.allDay ? "00:00" : (first.startTime ?? "00:00");
    const lastEnd = last.allDay ? "23:59" : (last.endTime ?? "23:59");
    startDate = new Date(`${first.date}T${firstStart}:00`);
    endDate = new Date(`${last.date}T${lastEnd}:00`);
  }

  const updated = await db.event.update({
    where: { id },
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
      websiteUrl: data.websiteUrl || null,
      facebookUrl: data.facebookUrl || null,
      tags: { set: tagIds?.map((id) => ({ id })) ?? [] },
      features: { set: featureIds?.map((id) => ({ id })) ?? [] },
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

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireOrganizerAuth();
  if ("error" in result && result.error) return result.error;
  const { session } = result as { session: NonNullable<typeof result.session> };

  const { id } = await params;

  const event = await db.event.findUnique({
    where: { id },
    select: { submittedById: true, status: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (event.submittedById !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (event.status !== "DRAFT" && event.status !== "PENDING" && event.status !== "REJECTED") {
    return NextResponse.json(
      { error: "Only DRAFT, PENDING, or REJECTED events can be deleted" },
      { status: 400 }
    );
  }

  await db.event.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
