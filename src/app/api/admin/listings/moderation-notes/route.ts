import { NextResponse } from "next/server";
import { requireApiAdminPermission } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { listingModerationNoteCreateSchema } from "@/lib/validations/admin";
import { adminListingEvidenceEnabled } from "@/lib/feature-flags";

/**
 * POST: add a moderation note to a market or event.
 * GET: list notes for ?marketId= or ?eventId=
 */
export async function GET(request: Request) {
  const { error } = await requireApiAdminPermission("admin.listings.manage");
  if (error) return error;
  if (!adminListingEvidenceEnabled()) {
    return apiError("Listing moderation notes API is disabled", 404);
  }

  const { searchParams } = new URL(request.url);
  const marketId = searchParams.get("marketId");
  const eventId = searchParams.get("eventId");
  const hasM = Boolean(marketId);
  const hasE = Boolean(eventId);
  if (hasM === hasE) {
    return apiError("Provide exactly one of marketId or eventId", 400);
  }

  const rows = await db.listingModerationNote.findMany({
    where: marketId ? { marketId } : { eventId: eventId as string },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { session, error } = await requireApiAdminPermission("admin.listings.manage");
  if (error) return error;
  if (!adminListingEvidenceEnabled()) {
    return apiError("Listing moderation notes API is disabled", 404);
  }

  const body = await request.json();
  const parsed = listingModerationNoteCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.flatten().fieldErrors);
  }

  const data = parsed.data;
  if (data.marketId) {
    const m = await db.market.findFirst({
      where: { id: data.marketId, deletedAt: null },
      select: { id: true },
    });
    if (!m) return apiError("Market not found", 404);
  } else if (data.eventId) {
    const e = await db.event.findFirst({
      where: { id: data.eventId, deletedAt: null },
      select: { id: true },
    });
    if (!e) return apiError("Event not found", 404);
  }

  const row = await db.listingModerationNote.create({
    data: {
      marketId: data.marketId ?? null,
      eventId: data.eventId ?? null,
      note: data.note,
      visibility: data.visibility ?? "ADMIN_ONLY",
      authorId: session.user.id,
    },
  });

  return NextResponse.json(row, { status: 201 });
}
