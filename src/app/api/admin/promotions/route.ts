import { auth } from "@/auth";
import { db } from "@/lib/db";
import { promotionSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function GET(request: Request) {
  const result = await requireAdmin();
  if ("error" in result && result.error) return result.error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const [promotions, total] = await Promise.all([
    db.promotion.findMany({
      skip,
      take: limit,
      include: {
        event: {
          select: { id: true, title: true, slug: true, startDate: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
    }),
    db.promotion.count(),
  ]);

  return NextResponse.json({
    promotions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: Request) {
  const result = await requireAdmin();
  if ("error" in result && result.error) return result.error;

  const body = await request.json();
  const parsed = promotionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const promotion = await db.promotion.create({
    data: {
      eventId: data.eventId,
      type: data.type,
      sponsorName: data.sponsorName || null,
      imageUrl: data.imageUrl || null,
      linkUrl: data.linkUrl || null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      sortOrder: data.sortOrder ?? 0,
    },
    include: {
      event: {
        select: { id: true, title: true, slug: true, startDate: true },
      },
    },
  });

  return NextResponse.json(promotion, { status: 201 });
}
