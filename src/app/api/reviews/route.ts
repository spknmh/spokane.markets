import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ok, retryAfter } = checkRateLimit(session.user.id, "reviews");
  if (!ok) {
    const headers = retryAfter ? { "Retry-After": String(retryAfter) } : undefined;
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers }
    );
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

  const existing = await db.review.findFirst({
    where: {
      userId: session.user.id!,
      ...(eventId ? { eventId } : { marketId: marketId! }),
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already reviewed this event or market." },
      { status: 409 }
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
