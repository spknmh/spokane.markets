import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { importData, parseVenuesCsv, type ImportPayload } from "@/lib/admin/data-import";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const format = (formData.get("format") as string) || "json";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const text = await file.text();
  let payload: ImportPayload;

  try {
    if (format === "csv") {
      const venues = parseVenuesCsv(text);
      payload = { venues };
    } else {
      const parsed = JSON.parse(text) as ImportPayload;
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid JSON structure");
      }
      payload = {
        venues: Array.isArray(parsed.venues) ? parsed.venues : undefined,
        markets: Array.isArray(parsed.markets) ? parsed.markets : undefined,
        events: Array.isArray(parsed.events) ? parsed.events : undefined,
      };
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid file format" },
      { status: 400 }
    );
  }

  const result = await importData(payload);
  return NextResponse.json(result);
}
