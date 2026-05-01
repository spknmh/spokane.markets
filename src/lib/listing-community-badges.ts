import { db } from "@/lib/db";
import type { BadgeDefinition } from "@prisma/client";
import { MAX_LISTING_COMMUNITY_BADGES } from "@/lib/listing-community-badge-constants";

export type ListingCommunityBadgeOption = Pick<
  BadgeDefinition,
  "id" | "slug" | "name" | "description" | "icon" | "sortOrder"
>;

export async function getListingCommunityBadgeOptions(): Promise<
  ListingCommunityBadgeOption[]
> {
  return db.badgeDefinition.findMany({
    where: { category: "LISTING_COMMUNITY" },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      icon: true,
      sortOrder: true,
    },
  });
}

export async function assertListingCommunityBadgeIds(
  badgeIds: string[] | undefined
): Promise<string[]> {
  if (!badgeIds?.length) return [];
  const uniqueBadgeIds = [...new Set(badgeIds.filter(Boolean))];
  if (uniqueBadgeIds.length > MAX_LISTING_COMMUNITY_BADGES) {
    throw new Error(
      `Select at most ${MAX_LISTING_COMMUNITY_BADGES} community badges`
    );
  }

  const validRows = await db.badgeDefinition.findMany({
    where: {
      id: { in: uniqueBadgeIds },
      category: "LISTING_COMMUNITY",
    },
    select: { id: true },
  });
  const validIds = new Set(validRows.map((row) => row.id));
  const invalidIds = uniqueBadgeIds.filter((id) => !validIds.has(id));
  if (invalidIds.length > 0) {
    throw new Error("One or more selected community badges are invalid");
  }
  return uniqueBadgeIds;
}
