import { z } from "zod";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
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

const patchConfigSchema = z.object({
  key: z.enum(BANNER_KEYS),
  value: z.string().min(1, "Value must be a non-empty URL").refine(
    (v) => v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/uploads/"),
    { message: "Invalid URL format" }
  ),
});

export async function GET() {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const rows = await db.siteConfig.findMany({
      where: { key: { in: [...BANNER_KEYS] } },
    });
    const config: Record<string, string> = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }
    return NextResponse.json(config);
  } catch (err) {
    console.error("[GET /api/admin/site-config]", err);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const body = await request.json();
    const parsed = patchConfigSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const { key, value } = parsed.data;

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
  } catch (err) {
    console.error("[PATCH /api/admin/site-config]", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key || !BANNER_KEYS.includes(key as BannerKey)) {
      return apiError("Invalid key", 400);
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

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/admin/site-config]", err);
    return apiError("Internal server error", 500);
  }
}
