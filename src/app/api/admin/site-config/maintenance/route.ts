import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import type { MaintenanceMode } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await db.siteState.findUnique({
    where: { id: "default" },
  });
  if (!row) {
    return NextResponse.json({
      mode: "OFF",
      messageTitle: "We'll be right back",
      messageBody: null,
      links: [],
      eta: null,
    });
  }

  const links = Array.isArray(row.links)
    ? (row.links as { label?: string; url?: string }[])
        .filter((x) => x?.label && x?.url)
        .map((x) => ({ label: x.label!, url: x.url! }))
    : [];

  return NextResponse.json({
    mode: row.mode,
    messageTitle: row.messageTitle,
    messageBody: row.messageBody,
    links,
    eta: row.eta?.toISOString() ?? null,
  });
}

const MODES: MaintenanceMode[] = [
  "OFF",
  "MAINTENANCE_ADMIN_ONLY",
  "MAINTENANCE_PRIVILEGED",
];

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const mode = typeof body.mode === "string" && MODES.includes(body.mode as MaintenanceMode)
    ? (body.mode as MaintenanceMode)
    : "OFF";
  const messageTitle =
    typeof body.messageTitle === "string"
      ? body.messageTitle.trim() || "We'll be right back"
      : "We'll be right back";
  const messageBody =
    typeof body.messageBody === "string" ? body.messageBody.trim() || null : null;
  let links: { label: string; url: string }[] = [];
  if (Array.isArray(body.links)) {
    links = body.links
      .filter(
        (x: unknown): x is { label?: string; url?: string } =>
          x != null && typeof x === "object"
      )
      .map((x: { label?: string; url?: string }) => ({
        label: typeof x.label === "string" ? x.label.trim() : "",
        url: typeof x.url === "string" ? x.url.trim() : "",
      }))
      .filter((x: { label: string; url: string }) => x.label && x.url);
  }
  let eta: Date | null = null;
  if (body.eta != null && body.eta !== "") {
    const parsed = new Date(body.eta);
    if (!Number.isNaN(parsed.getTime())) eta = parsed;
  }

  await db.siteState.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      mode,
      messageTitle,
      messageBody,
      links: links,
      eta,
      updatedByUserId: session.user.id,
    },
    update: {
      mode,
      messageTitle,
      messageBody,
      links,
      eta,
      updatedByUserId: session.user.id,
    },
  });

  await logAudit(
    session.user.id,
    "UPDATE_MAINTENANCE_MODE",
    "SITE_STATE",
    "default",
    { mode, messageTitle }
  );

  revalidatePath("/");
  revalidatePath("/maintenance");

  return NextResponse.json({ ok: true });
}
