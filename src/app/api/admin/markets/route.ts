import { db } from "@/lib/db";
import { assertNeighborhoodSlug } from "@/lib/neighborhoods";
import { marketSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { requireApiAdminPermission } from "@/lib/api-auth";

export async function POST(request: Request) {
  const { error } = await requireApiAdminPermission("admin.listings.manage");
  if (error) return error;

  const body = await request.json();
  const parsed = marketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const venueExists = await db.venue.findFirst({
    where: { id: data.venueId, deletedAt: null },
    select: { id: true },
  });
  if (!venueExists) {
    return NextResponse.json(
      { error: { message: "Selected venue is archived or missing" } },
      { status: 400 }
    );
  }
  let baseArea: string | null;
  try {
    baseArea = await assertNeighborhoodSlug(data.baseArea, "baseArea");
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          message: err instanceof Error ? err.message : "Invalid baseArea value",
        },
      },
      { status: 400 }
    );
  }
  const market = await db.market.create({
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
      ...(data.participationMode && { participationMode: data.participationMode }),
      ...(data.vendorCapacity != null && { vendorCapacity: data.vendorCapacity }),
      ...(data.publicIntentListEnabled !== undefined && {
        publicIntentListEnabled: data.publicIntentListEnabled,
      }),
      ...(data.publicIntentNamesEnabled !== undefined && {
        publicIntentNamesEnabled: data.publicIntentNamesEnabled,
      }),
      ...(data.publicRosterEnabled !== undefined && {
        publicRosterEnabled: data.publicRosterEnabled,
      }),
    },
  });

  return NextResponse.json(market, { status: 201 });
}
