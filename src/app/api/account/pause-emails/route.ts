import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.notificationPreference.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      emailsPausedAt: new Date(),
    },
    update: { emailsPausedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
