import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vendorSurveySchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

function toOptional(value: string | undefined): string | undefined {
  if (value === undefined || value === "") return undefined;
  return value;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "unknown";
    const { ok, retryAfter } = checkRateLimit(ip, "vendorSurvey");
    if (!ok) {
      const headers = retryAfter ? { "Retry-After": String(retryAfter) } : undefined;
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers }
      );
    }

    const body = await request.json();
    const parsed = vendorSurveySchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const message = firstIssue?.message ?? "Validation failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;

    await db.vendorSurvey.create({
      data: {
        vendorType: data.vendorType,
        leadTimeNeeded: toOptional(data.leadTimeNeeded),
        biggestPainPoints: toOptional(data.biggestPainPoints),
        missingInfo: toOptional(data.missingInfo),
        willingnessToPay: toOptional(data.willingnessToPay),
        contactName: toOptional(data.contactName),
        contactEmail: toOptional(data.contactEmail),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Vendor survey API error:", err);
    return NextResponse.json(
      { error: "Failed to submit survey. Please try again." },
      { status: 500 }
    );
  }
}
