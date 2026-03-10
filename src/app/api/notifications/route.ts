import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10));
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const severity = searchParams.get("severity");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {
    userId: session.user.id,
    archivedAt: null,
  };
  if (unreadOnly) where.readAt = null;
  if (severity) where.severity = severity;
  if (category) where.category = category;

  const snoozedUntilFilter = searchParams.get("includeSnoozed") === "true"
    ? undefined
    : { OR: [{ snoozedUntil: null }, { snoozedUntil: { lt: new Date() } }] };

  const notifications = await db.notification.findMany({
    where: {
      ...where,
      ...snoozedUntilFilter,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      link: true,
      severity: true,
      category: true,
      objectId: true,
      objectType: true,
      metadata: true,
      readAt: true,
      archivedAt: true,
      snoozedUntil: true,
      createdAt: true,
    },
  });

  return NextResponse.json(notifications);
}
