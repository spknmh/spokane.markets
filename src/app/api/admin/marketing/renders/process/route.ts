import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { processMarketingRenderById, processNextQueuedMarketingRender } from "@/lib/marketing/render-worker";

function isWorkerTokenValid(request: Request): boolean {
  const token = process.env.MARKETING_RENDER_WORKER_TOKEN?.trim();
  if (!token) return false;
  const header = request.headers.get("x-marketing-worker-token")?.trim();
  return header === token;
}

export async function POST(request: Request) {
  try {
    let authorized = false;
    if (isWorkerTokenValid(request)) {
      authorized = true;
    } else {
      const { error } = await requireApiAdmin();
      if (!error) authorized = true;
    }
    if (!authorized) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json().catch(() => ({} as { renderId?: string }));
    if (body?.renderId) {
      await processMarketingRenderById(body.renderId);
      return NextResponse.json({ processedRenderId: body.renderId });
    }
    const processedRenderId = await processNextQueuedMarketingRender();
    return NextResponse.json({ processedRenderId });
  } catch (err) {
    console.error("[POST /api/admin/marketing/renders/process]", err);
    return apiError(err instanceof Error ? err.message : "Worker failed", 500);
  }
}
