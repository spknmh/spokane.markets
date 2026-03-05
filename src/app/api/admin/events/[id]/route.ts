import { auth } from "@/auth";
import { db } from "@/lib/db";
import { eventSchema } from "@/lib/validations";
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

  const { tagIds, featureIds, ...data } = parsed.data;

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
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      timezone: data.timezone || null,
      venueId: data.venueId,
      marketId: data.marketId || null,
      imageUrl: data.imageUrl || null,
      status: data.status,
      websiteUrl: data.websiteUrl || null,
      facebookUrl: data.facebookUrl || null,
      tags: { set: tagIds?.map((id) => ({ id })) ?? [] },
      features: { set: featureIds?.map((id) => ({ id })) ?? [] },
    },
  });

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
