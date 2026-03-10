import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attendances = await db.attendance.findMany({
    where: { userId: session.user.id },
    include: {
      event: {
        include: { venue: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(attendances);
}
