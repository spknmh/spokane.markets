import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { promotionPatchSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if ("error" in result && result.error) return result.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = promotionPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const promotion = await db.promotion.update({
    where: { id },
    data: {
      ...(data.eventId !== undefined && { eventId: data.eventId }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.sponsorName !== undefined && { sponsorName: data.sponsorName }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
      ...(data.linkUrl !== undefined && { linkUrl: data.linkUrl || null }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
    include: {
      event: {
        select: { id: true, title: true, slug: true, startDate: true },
      },
    },
  });

  return NextResponse.json(promotion);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if ("error" in result && result.error) return result.error;

  const { id } = await params;
  await db.promotion.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
