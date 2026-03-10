import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isValidTheme } from "@/lib/site-theme";

const SITE_THEME_KEY = "site_theme";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await db.siteConfig.findUnique({
    where: { key: SITE_THEME_KEY },
  });

  const theme = row?.value && isValidTheme(row.value) ? row.value : "cedar";
  return NextResponse.json({ theme });
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const theme = body.theme as string;

  if (!theme || !isValidTheme(theme)) {
    return NextResponse.json(
      { error: "Invalid theme. Must be cedar, evergreen, paper, or clay." },
      { status: 400 }
    );
  }

  await db.siteConfig.upsert({
    where: { key: SITE_THEME_KEY },
    create: { key: SITE_THEME_KEY, value: theme },
    update: { value: theme },
  });

  revalidatePath("/");

  return NextResponse.json({ ok: true, theme });
}
