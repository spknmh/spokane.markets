import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiNotFound } from "@/lib/api-response";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) return error;
    const { id } = await params;
    const existing = await db.marketingRender.findUnique({
      where: { id },
      include: {
        folders: { select: { folderId: true } },
        tags: { select: { tagId: true } },
      },
    });
    if (!existing || existing.deletedAt) return apiNotFound("Render");
    const duplicate = await db.marketingRender.create({
      data: {
        userId: session!.user.id,
        templateId: existing.templateId,
        templateVersion: existing.templateVersion,
        vendorId: existing.vendorId,
        eventId: existing.eventId,
        marketId: existing.marketId,
        variablesJson: existing.variablesJson as Prisma.InputJsonValue,
        scale: existing.scale,
        folders: existing.folders.length
          ? {
              createMany: {
                data: existing.folders.map((folder) => ({ folderId: folder.folderId })),
                skipDuplicates: true,
              },
            }
          : undefined,
        tags: existing.tags.length
          ? {
              createMany: {
                data: existing.tags.map((tag) => ({ tagId: tag.tagId })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      select: { id: true, status: true },
    });
    return NextResponse.json(duplicate, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/marketing/renders/:id/duplicate]", err);
    return apiError("Internal server error", 500);
  }
}
