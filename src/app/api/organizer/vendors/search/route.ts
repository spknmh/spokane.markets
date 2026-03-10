import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Search vendor profiles by business name or slug.
 * Used by organizers to add vendors to event roster.
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const vendors = await db.vendorProfile.findMany({
    where: {
      OR: [
        { businessName: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      businessName: true,
      slug: true,
      imageUrl: true,
      specialties: true,
    },
    take: 15,
    orderBy: { businessName: "asc" },
  });

  return NextResponse.json(vendors);
}
