import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reportSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

const TARGET_TYPES = ["EVENT", "MARKET", "VENDOR", "REVIEW"] as const;

async function targetExists(targetType: string, targetId: string): Promise<boolean> {
  switch (targetType) {
    case "EVENT":
      return (await db.event.findUnique({ where: { id: targetId }, select: { id: true } })) != null;
    case "MARKET":
      return (await db.market.findUnique({ where: { id: targetId }, select: { id: true } })) != null;
    case "VENDOR":
      return (await db.vendorProfile.findUnique({ where: { id: targetId }, select: { id: true } })) != null;
    case "REVIEW":
      return (await db.review.findUnique({ where: { id: targetId }, select: { id: true } })) != null;
    default:
      return false;
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ok, retryAfter } = await checkRateLimit(session.user.id, "reports");
  if (!ok) {
    const headers = retryAfter ? { "Retry-After": String(retryAfter) } : undefined;
    return NextResponse.json(
      { error: "Too many reports. Please try again later." },
      { status: 429, headers }
    );
  }

  const body = await request.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { targetType, targetId } = parsed.data;

  if (!TARGET_TYPES.includes(targetType as (typeof TARGET_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
  }

  const exists = await targetExists(targetType, targetId);
  if (!exists) {
    return NextResponse.json({ error: "Target not found" }, { status: 404 });
  }

  const report = await db.report.create({
    data: {
      userId: session.user.id,
      targetType,
      targetId,
      reason: parsed.data.reason ?? null,
      notes: parsed.data.notes ?? null,
    },
  });

  return NextResponse.json(report, { status: 201 });
}
