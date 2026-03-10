import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { subscriberSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export function generateUnsubscribeToken(email: string): string {
  const secret = process.env.BETTER_AUTH_SECRET || "";
  return crypto.createHmac("sha256", secret).update(email).digest("hex");
}

function validateUnsubscribeToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email);
  if (expected.length !== token.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

const VALID_SOURCES = ["digest", "filters", "favorites"] as const;

async function getSubscribeBody(request: Request): Promise<{ email: string; areas?: string[]; company?: string }> {
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
    const { ok, retryAfter } = await checkRateLimit(ip, "subscribe");
    if (!ok) {
      const headers = retryAfter ? { "Retry-After": String(retryAfter) } : undefined;
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers }
      );
    }

    const body = await getSubscribeBody(request);
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
    console.error("Subscribe API error:", err);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const token = searchParams.get("token");
    const source = searchParams.get("source") ?? "digest";

    if (!email || typeof email !== "string" || email.trim() === "") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 401 });
    }

    if (!validateUnsubscribeToken(email.toLowerCase().trim(), token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!VALID_SOURCES.includes(source as (typeof VALID_SOURCES)[number])) {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (source === "digest") {
      await db.subscriber.deleteMany({ where: { email: normalizedEmail } });
      return NextResponse.json({ success: true });
    }

    if (source === "filters") {
      const user = await db.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      if (user) {
        await db.savedFilter.updateMany({
          where: { userId: user.id },
          data: { emailAlerts: false },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (source === "favorites") {
      const user = await db.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      if (user) {
        await db.favoriteVendor.updateMany({
          where: { userId: user.id },
          data: { emailAlerts: false },
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  } catch (err) {
    console.error("Unsubscribe API error:", err);
    return NextResponse.json(
      { error: "Failed to unsubscribe. Please try again." },
      { status: 500 }
    );
  }
}
