import { auth } from "@/auth";
import { db } from "@/lib/db";
import { vendorClaimRequestSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
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
  const parsed = vendorClaimRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  const { vendorProfileId, proof } = parsed.data;

  const vendor = await db.vendorProfile.findUnique({
    where: { id: vendorProfileId },
    select: { id: true, userId: true },
  });
  if (!vendor) {
    return NextResponse.json(
      { error: { message: "Vendor not found" } },
      { status: 404 }
    );
  }

  if (vendor.userId != null) {
    return NextResponse.json(
      { error: { message: "This vendor has already been claimed" } },
      { status: 409 }
    );
  }

  const existingClaim = await db.vendorClaimRequest.findFirst({
    where: {
      vendorProfileId,
      userId: session.user.id,
      status: "PENDING",
    },
  });
  if (existingClaim) {
    return NextResponse.json(
      { error: { message: "You already have a pending claim for this vendor" } },
      { status: 409 }
    );
  }

  const claim = await db.vendorClaimRequest.create({
    data: {
      vendorProfileId,
      userId: session.user.id,
      proof,
      status: "PENDING",
    },
  });

  return NextResponse.json(claim, { status: 201 });
}
