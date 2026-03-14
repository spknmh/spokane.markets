import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { assertNeighborhoodSlug } from "@/lib/neighborhoods";
import { organizerMarketCreateSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const { session, error } = await requireApiAuth();
    if (error) return error;

    const body = await request.json();
    const parsed = organizerMarketCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Validation failed", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const data = parsed.data;
    let baseArea: string | null;
    try {
      baseArea = await assertNeighborhoodSlug(data.baseArea, "baseArea");
    } catch (err) {
      return NextResponse.json(
        {
          error: {
            message: err instanceof Error ? err.message : "Invalid base area value",
          },
        },
        { status: 400 }
      );
    }

    const market = await db.$transaction(async (tx) => {
      const created = await tx.market.create({
        data: {
          name: data.name,
          slug: data.slug,
          venueId: data.venueId,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          websiteUrl: data.websiteUrl || null,
          facebookUrl: data.facebookUrl || null,
          instagramUrl: data.instagramUrl || null,
          baseArea,
          typicalSchedule: data.typicalSchedule || null,
          contactEmail: data.contactEmail || null,
          contactPhone: data.contactPhone || null,
          verificationStatus: "PENDING",
          ownerId: session.user.id,
          participationMode: data.participationMode ?? "OPEN",
          vendorCapacity: data.vendorCapacity ?? null,
          publicIntentListEnabled: data.publicIntentListEnabled ?? true,
          publicIntentNamesEnabled: data.publicIntentNamesEnabled ?? true,
          publicRosterEnabled: data.publicRosterEnabled ?? true,
        },
      });

      await tx.marketMembership.upsert({
        where: {
          marketId_userId: {
            marketId: created.id,
            userId: session.user.id,
          },
        },
        update: { role: "OWNER" },
        create: {
          marketId: created.id,
          userId: session.user.id,
          role: "OWNER",
        },
      });

      await tx.user.update({
        where: { id: session.user.id },
        data: {
          role: session.user.role === "ADMIN" ? "ADMIN" : "ORGANIZER",
        },
      });

      return created;
    });

    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: "MARKET_MODERATION_REQUIRED",
        title: "New market pending review",
        body: `${market.name} was created and is waiting for moderation.`,
        link: "/admin/markets",
        objectType: "market",
        objectId: market.id,
      });
    }

    await logAudit(session.user.id, "CREATE_MARKET", "MARKET", market.id, {
      moderationStatus: "PENDING",
    });

    return NextResponse.json(market, { status: 201 });
  } catch (err) {
    console.error("[POST /api/organizer/markets]", err);
    return NextResponse.json({ error: "Failed to create market" }, { status: 500 });
  }
}
