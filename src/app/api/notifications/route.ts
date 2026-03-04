import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10));
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const notifications = await db.notification.findMany({
    where: {
      userId: session.user.id,
      ...(unreadOnly ? { readAt: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      link: true,
      readAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(notifications);
}
