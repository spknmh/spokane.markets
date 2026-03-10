import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.siteConfig.findMany({
    where: {
      key: { in: ["landing_enabled", "landing_header", "landing_text"] },
    },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return NextResponse.json({
    enabled: map.landing_enabled === "true",
    header: map.landing_header ?? "Coming Soon",
    text: map.landing_text ?? "We're working on something great. Check back soon!",
  });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const enabled = Boolean(body.enabled);
  const header = typeof body.header === "string" ? body.header.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";

  await db.$transaction([
    db.siteConfig.upsert({
      where: { key: "landing_enabled" },
      create: { key: "landing_enabled", value: enabled ? "true" : "false" },
      update: { value: enabled ? "true" : "false" },
    }),
    db.siteConfig.upsert({
      where: { key: "landing_header" },
      create: { key: "landing_header", value: header || "Coming Soon" },
      update: { value: header || "Coming Soon" },
    }),
    db.siteConfig.upsert({
      where: { key: "landing_text" },
      create: { key: "landing_text", value: text || "We're working on something great. Check back soon!" },
      update: { value: text || "We're working on something great. Check back soon!" },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/landing");

  return NextResponse.json({ ok: true });
}
