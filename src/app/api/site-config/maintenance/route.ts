import { NextResponse } from "next/server";
import { getMaintenanceState } from "@/lib/maintenance";

/**
 * Public API for maintenance config. Used by the proxy.
 * Cached 10s to reduce DB load. No auth required so the proxy can fetch it.
 */
export async function GET() {
  try {
    const state = await getMaintenanceState();
    return NextResponse.json(
      {
        mode: state.mode,
        messageTitle: state.messageTitle,
        messageBody: state.messageBody,
        eta: state.eta?.toISOString() ?? null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch {
    // On DB error, fail OPEN: allow through
    return NextResponse.json(
      { mode: "OFF", messageTitle: "We'll be right back", messageBody: null, eta: null },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  }
}
