import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { eventId, marketId, ...rest } = parsed.data;

  if (!eventId && !marketId) {
    return NextResponse.json(
      { error: "Either eventId or marketId is required" },
      { status: 400 }
    );
  }

  const review = await db.review.create({
    data: {
      userId: session.user.id!,
      eventId: eventId ?? null,
      marketId: marketId ?? null,
      status: "PENDING",
      ...rest,
    },
  });

  return NextResponse.json(review, { status: 201 });
}
