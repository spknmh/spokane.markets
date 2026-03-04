import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
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
