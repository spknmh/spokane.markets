import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertListingCommunityBadgeIds } from "@/lib/listing-community-badges";
import { assertNeighborhoodSlug } from "@/lib/neighborhoods";
import { organizerManageMarketWhere } from "@/lib/market-membership";
import { organizerMarketPatchSchema } from "@/lib/validations";
import {
  pickOnboardingFields,
  toMarketOnboardingPrismaData,
} from "@/lib/validations/organizer-onboarding";
import { NextResponse } from "next/server";

/**
 * PUT: Update market (organizer only, verified markets they own).
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const market = await db.market.findFirst({
    where: {
      id,
      ...(session.user.role === "ADMIN" ? {} : organizerManageMarketWhere(session.user.id)),
    },
    select: { verificationStatus: true },
  });

  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }
  if (market.verificationStatus !== "VERIFIED" && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only verified markets can be edited by organizers" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = organizerMarketPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: { message: "Validation failed", details: parsed.error.flatten() },
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  let listingCommunityBadgeIds: string[] | undefined;
  if (data.listingCommunityBadgeIds !== undefined) {
    try {
      listingCommunityBadgeIds = await assertListingCommunityBadgeIds(
        data.listingCommunityBadgeIds
      );
    } catch (err) {
      return NextResponse.json(
        {
          error: {
            message:
              err instanceof Error ? err.message : "Invalid community badges",
          },
        },
        { status: 400 }
      );
    }
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

  const onboarding = toMarketOnboardingPrismaData(
    pickOnboardingFields(data as unknown as Record<string, unknown>)
  );

  const updated = await db.market.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      ...(data.imageFocalX != null && { imageFocalX: data.imageFocalX }),
      ...(data.imageFocalY != null && { imageFocalY: data.imageFocalY }),
      websiteUrl: data.websiteUrl || null,
      facebookUrl: data.facebookUrl || null,
      instagramUrl: data.instagramUrl || null,
      baseArea,
      typicalSchedule: data.typicalSchedule ?? null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone ?? null,
      ...(listingCommunityBadgeIds !== undefined && {
        listingCommunityBadges: {
          set: listingCommunityBadgeIds.map((badgeId) => ({ id: badgeId })),
        },
      }),
      ...onboarding,
    },
  });

  return NextResponse.json(updated);
}
