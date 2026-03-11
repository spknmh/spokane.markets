import { z } from "zod";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import {
  BANNER_KEYS,
  getBannerFocalXKey,
  getBannerFocalYKey,
  isBannerConfigKey,
} from "@/lib/banner-config";

const patchConfigSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value must be provided"),
});

function validateConfigValue(key: string, value: string): string | null {
  if (!isBannerConfigKey(key)) return "Invalid key";

  if ((BANNER_KEYS as readonly string[]).includes(key)) {
    return value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("/uploads/")
      ? null
      : "Invalid URL format";
  }

  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
    return "Focal point must be between 0 and 100";
  }

  return null;
}

function revalidateBannerPages() {
  revalidatePath("/");
  revalidatePath("/markets");
  revalidatePath("/events");
  revalidatePath("/vendors");
  revalidatePath("/submit");
  revalidatePath("/vendor-survey");
  revalidatePath("/newsletter");
  revalidatePath("/about");
  revalidatePath("/auth");
  revalidatePath("/admin/settings");
}

export async function GET() {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const rows = await db.siteConfig.findMany({
      where: {
        key: {
          in: [
            ...BANNER_KEYS,
            ...BANNER_KEYS.map((key) => getBannerFocalXKey(key)),
            ...BANNER_KEYS.map((key) => getBannerFocalYKey(key)),
          ],
        },
      },
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
    const validationError = validateConfigValue(key, value);
    if (validationError) {
      return apiError(validationError, 400);
    }

    await db.siteConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    revalidateBannerPages();

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

    if (!key || !isBannerConfigKey(key)) {
      return apiError("Invalid key", 400);
    }

    await db.siteConfig.deleteMany({ where: { key } });

    revalidateBannerPages();

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/admin/site-config]", err);
    return apiError("Internal server error", 500);
  }
}
