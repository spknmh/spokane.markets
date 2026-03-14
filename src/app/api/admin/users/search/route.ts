import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireApiAdminPermission } from "@/lib/api-auth";

export async function GET(request: Request) {
  const { error } = await requireApiAdminPermission("admin.users.manage");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const allowVendorId = searchParams.get("allowVendorId") ?? undefined;

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const where = {
    AND: [
      {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      },
      allowVendorId !== undefined
        ? {
            OR: [
              { vendorProfile: null },
              { vendorProfile: { id: allowVendorId } },
            ],
          }
        : { vendorProfile: null },
    ],
  };

  const users = await db.user.findMany({
    where,
    select: { id: true, name: true, email: true },
    take: 10,
  });

  return NextResponse.json(users);
}
