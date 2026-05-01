import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { PromotionForm } from "@/components/admin/promotion-form";

export const dynamic = "force-dynamic";

export default async function NewPromotionPage() {
  await requireAdmin();

  const [events, vendors] = await Promise.all([
    db.event.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, slug: true, startDate: true },
      orderBy: { startDate: "asc" },
    }),
    db.vendorProfile.findMany({
      select: { id: true, businessName: true, slug: true },
      orderBy: { businessName: "asc" },
    }),
  ]);

  return (
    <div className="max-w-7xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">New Promotion</h1>
      <PromotionForm events={events} vendors={vendors} />
    </div>
  );
}
