import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  email: z.string().email("Valid email is required").optional(),
  areas: z.array(z.string()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await db.subscriber.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
  }

  const data: { email?: string; areas?: string[] } = {};
  if (parsed.data.email !== undefined) {
    data.email = parsed.data.email.toLowerCase();
    const duplicate = await db.subscriber.findFirst({
      where: { email: data.email, id: { not: id } },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: { email: ["This email is already subscribed"] } },
        { status: 409 }
      );
    }
  }
  if (parsed.data.areas !== undefined) data.areas = parsed.data.areas;

  const subscriber = await db.subscriber.update({
    where: { id },
    data,
  });
  return NextResponse.json(subscriber);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.subscriber.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
  }

  await db.subscriber.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
