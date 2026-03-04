import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.vendorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) {
      return NextResponse.json(
        { error: "No vendor profile found" },
        { status: 404 }
      );
    }

    const intents = await db.eventVendorIntent.findMany({
      where: { vendorProfileId: profile.id },
      include: {
        event: {
          include: {
            venue: true,
            market: true,
            tags: true,
            features: true,
          },
        },
      },
      orderBy: { event: { startDate: "asc" } },
    });

    return NextResponse.json(intents);
  } catch (err) {
    console.error("Intents GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch intents" },
      { status: 500 }
    );
  }
}
