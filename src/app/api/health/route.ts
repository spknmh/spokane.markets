import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("Health check failed:", err);
    return NextResponse.json(
      { status: "unhealthy", error: "Database unreachable" },
      { status: 503 }
    );
  }
}
