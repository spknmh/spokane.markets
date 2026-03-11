import { z } from "zod";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import {
  isValidSiteAnnouncementUrl,
  normalizeSiteAnnouncement,
} from "@/lib/site-announcement";

const patchAnnouncementSchema = z
  .object({
    enabled: z.boolean(),
    text: z.string().optional().default(""),
    linkLabel: z.string().optional().default(""),
    linkUrl: z.string().optional().default(""),
  })
  .superRefine((value, ctx) => {
    const text = value.text.trim();
    const linkLabel = value.linkLabel.trim();
    const linkUrl = value.linkUrl.trim();

    if (value.enabled && !text) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["text"],
        message: "Message is required when the announcement bar is enabled.",
      });
    }

    if ((linkLabel && !linkUrl) || (!linkLabel && linkUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["linkUrl"],
        message: "CTA label and URL are required together.",
      });
    }

    if (linkUrl && !isValidSiteAnnouncementUrl(linkUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["linkUrl"],
        message: "CTA URL must start with /, http://, or https://.",
      });
    }
  });

export async function GET() {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const rows = await db.siteConfig.findMany({
      where: {
        key: {
          in: [
            "site_announcement_enabled",
            "site_announcement_text",
            "site_announcement_link_label",
            "site_announcement_link_url",
          ],
        },
      },
    });

    const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));

    return NextResponse.json(
      normalizeSiteAnnouncement({
        enabled: values.site_announcement_enabled === "true",
        text: values.site_announcement_text ?? "",
        linkLabel: values.site_announcement_link_label ?? "",
        linkUrl: values.site_announcement_link_url ?? "",
      })
    );
  } catch (err) {
    console.error("[GET /api/admin/site-config/announcement]", err);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const body = await request.json();
    const parsed = patchAnnouncementSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const announcement = normalizeSiteAnnouncement(parsed.data);

    await db.$transaction([
      db.siteConfig.upsert({
        where: { key: "site_announcement_enabled" },
        create: {
          key: "site_announcement_enabled",
          value: announcement.enabled ? "true" : "false",
        },
        update: { value: announcement.enabled ? "true" : "false" },
      }),
      db.siteConfig.upsert({
        where: { key: "site_announcement_text" },
        create: { key: "site_announcement_text", value: announcement.text },
        update: { value: announcement.text },
      }),
      db.siteConfig.upsert({
        where: { key: "site_announcement_link_label" },
        create: {
          key: "site_announcement_link_label",
          value: announcement.linkLabel ?? "",
        },
        update: { value: announcement.linkLabel ?? "" },
      }),
      db.siteConfig.upsert({
        where: { key: "site_announcement_link_url" },
        create: {
          key: "site_announcement_link_url",
          value: announcement.linkUrl ?? "",
        },
        update: { value: announcement.linkUrl ?? "" },
      }),
    ]);

    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/admin/site-config/announcement]", err);
    return apiError("Internal server error", 500);
  }
}
