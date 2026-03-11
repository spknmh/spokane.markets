import { NextResponse } from "next/server";
import { getLandingConfig } from "@/lib/landing-config";

/** Public API for landing config. Used by the proxy. Cached 10s to reduce DB load. */
export async function GET() {
  const config = await getLandingConfig();
  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
    },
  });
}
