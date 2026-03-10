import { z } from "zod";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";

const patchLandingSchema = z.object({
  enabled: z.boolean(),
  header: z.string().optional().default("Coming Soon"),
  text: z.string().optional().default("We're working on something great. Check back soon!"),
});

export async function GET() {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

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
  } catch (err) {
    console.error("[GET /api/admin/site-config/landing]", err);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const body = await request.json();
    const parsed = patchLandingSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const { enabled, header, text } = parsed.data;

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
  } catch (err) {
    console.error("[PATCH /api/admin/site-config/landing]", err);
    return apiError("Internal server error", 500);
  }
}
