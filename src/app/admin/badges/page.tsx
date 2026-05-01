import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { CommunityBadgesManager } from "@/components/admin/community-badges-manager";

export const dynamic = "force-dynamic";

export default async function AdminCommunityBadgesPage() {
  await requireAdmin();

  const badges = await db.badgeDefinition.findMany({
    where: { category: "LISTING_COMMUNITY" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { vendorProfiles: true, markets: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Badges</h1>
        <p className="mt-1 text-muted-foreground">
          Create and manage the badge definitions admins, vendors, and organizers can apply.
        </p>
      </div>
      <CommunityBadgesManager initialBadges={badges} />
    </div>
  );
}
