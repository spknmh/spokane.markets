import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const type = searchParams.get("type") ?? undefined;

  const applications = await db.application.findMany({
    where: {
      ...(status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {}),
      ...(type ? { form: { type: type as "VENDOR" | "MARKET" } } : {}),
    },
    include: {
      form: { select: { type: true, title: true } },
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications);
}
