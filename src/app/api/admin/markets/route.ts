import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertNeighborhoodSlug } from "@/lib/neighborhoods";
import { marketSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = marketSchema.safeParse(body);
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
