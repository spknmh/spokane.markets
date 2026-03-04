import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { attendanceSchema } from "@/lib/validations";
import { evaluateAndGrantBadges } from "@/lib/badges";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const event = await db.event.findUnique({ where: { slug } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = attendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { status } = parsed.data;
  const userId = session.user.id!;

  const existing = await db.attendance.findUnique({
    where: { userId_eventId: { userId, eventId: event.id } },
  });

  if (existing) {
    if (existing.status === status) {
      await db.attendance.delete({ where: { id: existing.id } });
    } else {
      await db.attendance.update({
        where: { id: existing.id },
        data: { status },
      });
    }
  } else {
    await db.attendance.create({
      data: { userId, eventId: event.id, status },
    });
  }

  evaluateAndGrantBadges(userId).catch(() => {});

  const [goingCount, interestedCount] = await Promise.all([
    db.attendance.count({ where: { eventId: event.id, status: "GOING" } }),
    db.attendance.count({ where: { eventId: event.id, status: "INTERESTED" } }),
  ]);

  const userAttendance = await db.attendance.findUnique({
    where: { userId_eventId: { userId, eventId: event.id } },
  });

  return NextResponse.json({
    goingCount,
    interestedCount,
    userStatus: userAttendance?.status ?? null,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const event = await db.event.findUnique({ where: { slug } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const userId = session.user.id!;

  const existing = await db.attendance.findUnique({
    where: { userId_eventId: { userId, eventId: event.id } },
  });

  if (existing) {
    await db.attendance.delete({ where: { id: existing.id } });
  }

  evaluateAndGrantBadges(userId).catch(() => {});

  const [goingCount, interestedCount] = await Promise.all([
    db.attendance.count({ where: { eventId: event.id, status: "GOING" } }),
    db.attendance.count({ where: { eventId: event.id, status: "INTERESTED" } }),
  ]);

  const userAttendance = await db.attendance.findUnique({
    where: { userId_eventId: { userId, eventId: event.id } },
  });

  return NextResponse.json({
    goingCount,
    interestedCount,
    userStatus: userAttendance?.status ?? null,
  });
}
