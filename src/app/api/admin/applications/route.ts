import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireApiAdminPermission } from "@/lib/api-auth";

export async function GET(request: Request) {
  const { error } = await requireApiAdminPermission("admin.moderation.manage");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const type = searchParams.get("type") ?? undefined;

  const applications = await db.application.findMany({
    where: {
      ...(status
        ? {
            status: status as
              | "PENDING"
              | "APPROVED"
              | "REJECTED"
              | "NEEDS_INFO"
              | "DUPLICATE",
          }
        : {}),
      ...(type
        ? { form: { type: type as "VENDOR" | "MARKET" | "VENDOR_VERIFICATION" } }
        : {}),
    },
    include: {
      form: { select: { type: true, title: true } },
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}
