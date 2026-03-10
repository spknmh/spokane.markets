import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { promotionPatchSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const parsed = promotionPatchSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
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
  } catch (err) {
    console.error("[PATCH /api/admin/promotions/:id]", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const { id } = await params;
    await db.promotion.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/admin/promotions/:id]", err);
    return apiError("Internal server error", 500);
  }
}
