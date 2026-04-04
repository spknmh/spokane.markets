import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiNotFound } from "@/lib/api-response";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

type OutputEntry = {
  name: string;
  url: string;
  width?: number;
  height?: number;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) return error;
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind") === "txt" ? "txt" : "png";
    const name = searchParams.get("name");
    const format = searchParams.get("format") ?? "redirect";

    const render = await db.marketingRender.findUnique({
      where: { id },
      select: {
        id: true,
        deletedAt: true,
        pngOutputsJson: true,
        textOutputsJson: true,
      },
    });
    if (!render || render.deletedAt) return apiNotFound("Render");

    const outputs = (kind === "png" ? render.pngOutputsJson : render.textOutputsJson) as OutputEntry[] | null;
    if (!outputs?.length) {
      return apiError("Requested output is not available", 404);
    }
    const target = name
      ? outputs.find((item) => item.name === name)
      : outputs[0];
    if (!target) {
      return apiError("File not found in render output", 404);
    }

    await db.auditLog.create({
      data: {
        userId: session?.user.id,
        action: "MARKETING_RENDER_DOWNLOAD",
        targetType: "MARKETING_RENDER",
        targetId: id,
        metadata: { kind, name: target.name },
      },
    });

    if (format === "json") {
      return NextResponse.json({
        renderId: id,
        file: target,
      });
    }
    return NextResponse.redirect(new URL(target.url, request.url));
  } catch (err) {
    console.error("[GET /api/admin/marketing/renders/:id/download]", err);
    return apiError("Internal server error", 500);
  }
}
