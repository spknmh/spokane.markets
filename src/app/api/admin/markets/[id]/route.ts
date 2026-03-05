import { auth } from "@/auth";
import { db } from "@/lib/db";
import { marketSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if ("error" in result && result.error) return result.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = marketSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
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
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if ("error" in result && result.error) return result.error;

  const { id } = await params;
  await db.market.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
