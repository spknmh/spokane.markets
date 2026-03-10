import { z } from "zod";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import type { MaintenanceMode } from "@prisma/client";

const maintenanceLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
});

const patchMaintenanceSchema = z.object({
  mode: z.enum(["OFF", "MAINTENANCE_ADMIN_ONLY", "MAINTENANCE_PRIVILEGED"]).default("OFF"),
  messageTitle: z.string().optional().default("We'll be right back"),
  messageBody: z.string().nullable().optional(),
  links: z.array(maintenanceLinkSchema).optional().default([]),
  eta: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

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
  } catch (err) {
    console.error("[GET /api/admin/site-config/maintenance]", err);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) {
      console.warn("[PATCH /api/admin/site-config/maintenance] auth failed");
      return error;
    }

    const body = await request.json();
    const parsed = patchMaintenanceSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[PATCH /api/admin/site-config/maintenance] validation failed:", parsed.error.issues);
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const { mode, messageTitle, messageBody, links } = parsed.data;

    let eta: Date | null = null;
    if (parsed.data.eta != null && parsed.data.eta !== "") {
      const d = new Date(parsed.data.eta);
      if (!Number.isNaN(d.getTime())) eta = d;
    }

    const result = await db.siteState.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        mode: mode as MaintenanceMode,
        messageTitle: messageTitle || "We'll be right back",
        messageBody: messageBody || null,
        links: links,
        eta,
        updatedByUserId: session.user.id,
      },
      update: {
        mode: mode as MaintenanceMode,
        messageTitle: messageTitle || "We'll be right back",
        messageBody: messageBody || null,
        links,
        eta,
        updatedByUserId: session.user.id,
      },
    });

    console.info("[PATCH /api/admin/site-config/maintenance] saved:", {
      mode: result.mode,
      messageTitle: result.messageTitle,
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
    revalidatePath("/admin/maintenance");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/admin/site-config/maintenance]", err);
    return apiError("Internal server error", 500);
  }
}
