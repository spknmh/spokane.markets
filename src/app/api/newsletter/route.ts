import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriberSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

async function getNewsletterBody(request: Request): Promise<{ email: string; areas?: string[]; company?: string }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return request.json();
  }
  const formData = await request.formData();
  const email = formData.get("email");
  const company = formData.get("company");
  return {
    email: typeof email === "string" ? email : "",
    areas: [],
    company: typeof company === "string" ? company : undefined,
  };
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "unknown";
    const { ok } = checkRateLimit(ip, "newsletter");
    if (!ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await getNewsletterBody(request);
    const parsed = subscriberSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const message = firstIssue?.message ?? "Validation failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { email, areas, company } = parsed.data;
    if (company && company.length > 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const normalizedEmail = email.toLowerCase();
    const areasArray = areas ?? [];

    await db.subscriber.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        areas: areasArray,
      },
      update: {
        areas: areasArray,
      },
    });

    const isFormSubmit = !(request.headers.get("content-type") ?? "").includes("application/json");
    if (isFormSubmit) {
      return NextResponse.redirect(new URL("/?subscribed=1", request.url), 303);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Newsletter API error:", err);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}
