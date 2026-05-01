import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { SITE_NAME } from "@/lib/constants";
import { OrganizerMarketForm } from "@/components/organizer-market-form";
import { getListingCommunityBadgeOptions } from "@/lib/listing-community-badges";
import { getNeighborhoodOptions } from "@/lib/neighborhoods";
import { notFound } from "next/navigation";
import { prismaListingToOnboardingFormDefaults } from "@/lib/validations/organizer-onboarding";
import type { OrganizerMarketPatchInput } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Edit Market — ${SITE_NAME}`,
};

export default async function OrganizerMarketEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("ORGANIZER");
  const { id } = await params;

  const [market, neighborhoods, listingCommunityBadgeOptions] = await Promise.all([
    db.market.findUnique({
      where: { id },
      include: {
        venue: { select: { name: true } },
        listingCommunityBadges: { select: { id: true } },
        memberships: {
          where: { role: { in: ["OWNER", "MANAGER"] } },
          select: { userId: true },
        },
      },
    }),
    getNeighborhoodOptions(),
    getListingCommunityBadgeOptions(),
  ]);

  if (!market) notFound();
  if (
    session.user.role !== "ADMIN" &&
    !(
      market.ownerId === session.user.id ||
      market.memberships.some((membership) => membership.userId === session.user.id)
    )
  ) {
    notFound();
  }
  if (market.verificationStatus !== "VERIFIED") {
    notFound();
  }

  const initialData = {
    name: market.name,
    description: market.description ?? "",
    imageUrl: market.imageUrl ?? "",
    imageFocalX: market.imageFocalX ?? 50,
    imageFocalY: market.imageFocalY ?? 50,
    websiteUrl: market.websiteUrl ?? "",
    facebookUrl: market.facebookUrl ?? "",
    instagramUrl: market.instagramUrl ?? "",
    baseArea: market.baseArea ?? "",
    typicalSchedule: market.typicalSchedule ?? "",
    contactEmail: market.contactEmail ?? "",
    contactPhone: market.contactPhone ?? "",
    listingCommunityBadgeIds: market.listingCommunityBadges.map(
      (badge) => badge.id
    ),
    ...prismaListingToOnboardingFormDefaults(market as unknown as Record<string, unknown>),
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/organizer/dashboard"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Back to Organizer Dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Edit Market
        </h1>
        <p className="mt-1 text-muted-foreground">
          {market.name} · {market.venue.name}
        </p>
      </div>

      <OrganizerMarketForm
        marketId={id}
        initialData={initialData as OrganizerMarketPatchInput}
        neighborhoods={neighborhoods}
        listingCommunityBadgeOptions={listingCommunityBadgeOptions}
      />
    </div>
  );
}
