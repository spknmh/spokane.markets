import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { claimRequestSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { ok, retryAfter } = checkRateLimit(session.user.id, "claims");
  if (!ok) {
    const headers = retryAfter ? { "Retry-After": String(retryAfter) } : undefined;
    return NextResponse.json(
      { error: { message: "Too many requests. Please try again later." } },
      { status: 429, headers }
    );
  }

  const body = await request.json();
  const parsed = claimRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { marketId, proof } = parsed.data;

  const market = await db.market.findUnique({ where: { id: marketId } });
  if (!market) {
    return NextResponse.json(
      { error: { message: "Market not found" } },
      { status: 404 }
    );
  }

  const existingClaim = await db.claimRequest.findFirst({
    where: {
      marketId,
      userId: session.user.id,
      status: "PENDING",
    },
  });
  if (existingClaim) {
    return NextResponse.json(
      { error: { message: "You already have a pending claim for this market" } },
      { status: 409 }
    );
  }

  const claim = await db.claimRequest.create({
    data: {
      marketId,
      userId: session.user.id,
      proof,
      status: "PENDING",
    },
  });

  return NextResponse.json(claim, { status: 201 });
}
