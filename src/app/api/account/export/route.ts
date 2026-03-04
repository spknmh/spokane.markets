import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, attendances, savedFilters, favoriteVendors, reviews] =
    await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          createdAt: true,
        },
      }),
      db.attendance.findMany({
        where: { userId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      }),
      db.savedFilter.findMany({ where: { userId } }),
      db.favoriteVendor.findMany({
        where: { userId },
        include: {
          vendorProfile: {
            select: {
              id: true,
              businessName: true,
              slug: true,
            },
          },
        },
      }),
      db.review.findMany({
        where: { userId },
        select: {
          id: true,
          rating: true,
          text: true,
          createdAt: true,
          event: { select: { title: true, slug: true } },
          market: { select: { name: true, slug: true } },
        },
      }),
    ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user,
    attendances: attendances.map((a) => ({
      status: a.status,
      event: a.event,
      createdAt: a.createdAt,
    })),
    savedFilters,
    favoriteVendors: favoriteVendors.map((fv) => ({
      vendor: fv.vendorProfile,
      emailAlerts: fv.emailAlerts,
      createdAt: fv.createdAt,
    })),
    reviews,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="spokane-markets-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
