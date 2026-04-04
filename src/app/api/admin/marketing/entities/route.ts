import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import {
  buildEntityPrefillVariables,
  searchMarketingEntities,
} from "@/lib/marketing/prefill-map";

export async function GET(request: Request) {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") ?? "search";

    if (mode === "prefill") {
      const vendorId = searchParams.get("vendorId");
      const eventId = searchParams.get("eventId");
      const marketId = searchParams.get("marketId");
      const variables = await buildEntityPrefillVariables({
        vendorId,
        eventId,
        marketId,
      });
      return NextResponse.json({ variables });
    }

    const kind = searchParams.get("kind");
    const q = searchParams.get("q") ?? "";
    if (kind !== "vendor" && kind !== "event" && kind !== "market") {
      return apiError("Invalid kind", 400);
    }
    const items = await searchMarketingEntities(kind, q);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/admin/marketing/entities]", err);
    return apiError("Internal server error", 500);
  }
}
