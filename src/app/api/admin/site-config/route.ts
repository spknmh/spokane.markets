import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const BANNER_KEYS = [
  "hero",
  "farmersMarket",
  "produce",
  "craftStall",
  "community",
  "localVendor",
  "marketCrowd",
  "events",
] as const;

export type BannerKey = (typeof BANNER_KEYS)[number];

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.siteConfig.findMany({
    where: { key: { in: [...BANNER_KEYS] } },
  });
  const config: Record<string, string> = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }
  return NextResponse.json(config);
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const key = body.key as string;
  const value = body.value as string;

  if (!key || !BANNER_KEYS.includes(key as BannerKey)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  if (typeof value !== "string" || value.length === 0) {
    return NextResponse.json({ error: "Value must be a non-empty URL" }, { status: 400 });
  }

  // Validate URL format (http/https or /uploads/...)
  const isValid =
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/uploads/");
  if (!isValid) {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  await db.siteConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  revalidatePath("/");
  revalidatePath("/markets");
  revalidatePath("/events");
  revalidatePath("/vendors");
  revalidatePath("/submit");
  revalidatePath("/vendor-survey");
  revalidatePath("/newsletter");
  revalidatePath("/about");
  revalidatePath("/auth");

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key || !BANNER_KEYS.includes(key as BannerKey)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  await db.siteConfig.deleteMany({ where: { key } });

  revalidatePath("/");
  revalidatePath("/markets");
  revalidatePath("/events");
  revalidatePath("/vendors");
  revalidatePath("/submit");
  revalidatePath("/vendor-survey");
  revalidatePath("/newsletter");
  revalidatePath("/about");
  revalidatePath("/auth");

  return NextResponse.json({ ok: true });
}
