import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiNotFound } from "@/lib/api-response";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;
    const { id } = await params;
    const render = await db.marketingRender.findUnique({
      where: { id },
      include: {
        template: true,
        user: { select: { id: true, name: true, email: true } },
        vendor: { select: { id: true, businessName: true, slug: true } },
        event: { select: { id: true, title: true, slug: true } },
        market: { select: { id: true, name: true, slug: true } },
        folders: { include: { folder: true } },
        tags: { include: { tag: true } },
      },
    });
    if (!render || render.deletedAt) return apiNotFound("Render");
    return NextResponse.json(render);
  } catch (err) {
    console.error("[GET /api/admin/marketing/renders/:id]", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) return error;
    const { id } = await params;
    const existing = await db.marketingRender.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) return apiNotFound("Render");
    await db.marketingRender.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await db.auditLog.create({
      data: {
        userId: session?.user.id,
        action: "MARKETING_RENDER_DELETE",
        targetType: "MARKETING_RENDER",
        targetId: id,
      },
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/admin/marketing/renders/:id]", err);
    return apiError("Internal server error", 500);
  }
}
