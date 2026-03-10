import { z } from "zod";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { isValidTheme } from "@/lib/site-theme";

const SITE_THEME_KEY = "site_theme";

const putThemeSchema = z.object({
  theme: z.enum(["cedar", "evergreen", "paper", "clay"]),
});

export async function GET() {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) return error;

    const row = await db.siteConfig.findUnique({
      where: { key: SITE_THEME_KEY },
    });

    const theme = row?.value && isValidTheme(row.value) ? row.value : "cedar";
    return NextResponse.json({ theme });
  } catch (err) {
    console.error("[GET /api/admin/site-config/theme]", err);
    return apiError("Internal server error", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) return error;

    const body = await request.json();
    const parsed = putThemeSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const { theme } = parsed.data;

    await db.siteConfig.upsert({
      where: { key: SITE_THEME_KEY },
      create: { key: SITE_THEME_KEY, value: theme },
      update: { value: theme },
    });

    revalidatePath("/");

    return NextResponse.json({ ok: true, theme });
  } catch (err) {
    console.error("[PUT /api/admin/site-config/theme]", err);
    return apiError("Internal server error", 500);
  }
}
