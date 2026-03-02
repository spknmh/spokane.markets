import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { MarketForm } from "@/components/admin/market-form";
import { notFound } from "next/navigation";

export default async function EditMarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const market = await db.market.findUnique({
    where: { id },
    include: { owner: { select: { name: true, email: true } } },
  });
  if (!market) notFound();

  const ownerDisplay = market.owner
    ? (market.owner.name || market.owner.email)
    : undefined;

  const initialData = {
    id: market.id,
    name: market.name,
    slug: market.slug,
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
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit Market</h1>
      <MarketForm initialData={initialData} ownerDisplay={ownerDisplay} />
    </div>
  );
}
