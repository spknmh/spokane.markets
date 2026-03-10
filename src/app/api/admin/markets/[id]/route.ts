import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { marketSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const parsed = marketSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data;
    const market = await db.market.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        venueId: data.venueId,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        websiteUrl: data.websiteUrl || null,
        facebookUrl: data.facebookUrl || null,
        instagramUrl: data.instagramUrl || null,
        baseArea: data.baseArea || null,
        typicalSchedule: data.typicalSchedule || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        ...(data.verificationStatus && {
          verificationStatus: data.verificationStatus,
        }),
        ...(data.ownerId !== undefined && {
          ownerId: data.ownerId || null,
        }),
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

    return NextResponse.json(market);
  } catch (err) {
    console.error("[PUT /api/admin/markets/:id]", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) return error;

    const { id } = await params;
    await db.market.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/admin/markets/:id]", err);
    return apiError("Internal server error", 500);
  }
}
