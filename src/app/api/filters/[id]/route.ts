import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { savedFilterSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.savedFilter.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = savedFilterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const filter = await db.savedFilter.update({
    where: { id },
    data: {
      name: parsed.data.name,
      dateRange: parsed.data.dateRange ?? null,
      neighborhoods: parsed.data.neighborhoods ?? [],
      categories: parsed.data.categories ?? [],
      features: parsed.data.features ?? [],
      emailAlerts: parsed.data.emailAlerts ?? false,
    },
  });

  return NextResponse.json(filter);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.savedFilter.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.savedFilter.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
