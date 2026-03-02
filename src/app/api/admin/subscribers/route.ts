import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  email: z.string().email("Valid email is required"),
  areas: z.array(z.string()).optional().default([]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, areas } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.subscriber.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return NextResponse.json(
      { error: { email: ["This email is already subscribed"] } },
      { status: 409 }
    );
  }

  const subscriber = await db.subscriber.create({
    data: { email: normalizedEmail, areas },
  });
  return NextResponse.json(subscriber, { status: 201 });
}
