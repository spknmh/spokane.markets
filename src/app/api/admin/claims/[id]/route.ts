import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (status !== "APPROVED" && status !== "REJECTED") {
    return NextResponse.json(
      { error: { message: "Status must be APPROVED or REJECTED" } },
      { status: 400 }
    );
  }

  const claim = await db.claimRequest.update({
    where: { id },
    data: {
      status,
      reviewerId: session.user.id,
    },
  });

  if (status === "APPROVED") {
    await db.market.update({
      where: { id: claim.marketId },
      data: {
        verificationStatus: "VERIFIED",
        ownerId: claim.userId,
      },
    });
  }

  return NextResponse.json(claim);
}
