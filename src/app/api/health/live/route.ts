import { NextResponse } from "next/server";

/**
 * Liveness probe: returns 200 when the HTTP server is up.
 * Does NOT check the database. Use for container healthchecks so the
 * proxy (Caddy) can start once the process is listening.
 * Use GET /api/health for full readiness (includes DB check).
 */
export async function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
