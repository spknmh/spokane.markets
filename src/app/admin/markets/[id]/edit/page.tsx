import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { MarketForm } from "@/components/admin/market-form";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditMarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [market, venues] = await Promise.all([
    db.market.findUnique({
      where: { id },
      include: { owner: { select: { name: true, email: true } } },
    }),
    db.venue.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!market) notFound();

  const ownerDisplay = market.owner
    ? (market.owner.name || market.owner.email)
    : undefined;

  const initialData = {
    id: market.id,
    name: market.name,
    slug: market.slug,
    venueId: market.venueId,
    description: market.description ?? "",
    imageUrl: market.imageUrl ?? "",
    websiteUrl: market.websiteUrl ?? "",
    facebookUrl: market.facebookUrl ?? "",
    instagramUrl: market.instagramUrl ?? "",
    baseArea: market.baseArea ?? "",
    typicalSchedule: market.typicalSchedule ?? "",
    contactEmail: market.contactEmail ?? "",
    contactPhone: market.contactPhone ?? "",
    verificationStatus: market.verificationStatus,
    ownerId: market.ownerId ?? "",
    participationMode: market.participationMode ?? "OPEN",
    vendorCapacity: market.vendorCapacity,
    publicIntentListEnabled: market.publicIntentListEnabled ?? true,
    publicIntentNamesEnabled: market.publicIntentNamesEnabled ?? true,
    publicRosterEnabled: market.publicRosterEnabled ?? true,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit Market</h1>
      <MarketForm initialData={initialData} venues={venues} ownerDisplay={ownerDisplay} />
    </div>
  );
}
