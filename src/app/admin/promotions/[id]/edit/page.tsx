import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { PromotionForm } from "@/components/admin/promotion-form";
import { notFound } from "next/navigation";

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  const [promotion, publishedEvents] = await Promise.all([
    db.promotion.findUnique({
      where: { id },
      include: {
        event: { select: { id: true, title: true, slug: true, startDate: true } },
      },
    }),
    db.event.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, slug: true, startDate: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  if (!promotion) {
    notFound();
  }

  const events =
    promotion.event && !publishedEvents.some((e) => e.id === promotion.event!.id)
      ? [promotion.event, ...publishedEvents]
      : publishedEvents;

  const initialData = {
    id: promotion.id,
    eventId: promotion.eventId ?? "",
    type: promotion.type,
    sponsorName: promotion.sponsorName,
    imageUrl: promotion.imageUrl ?? undefined,
    linkUrl: promotion.linkUrl ?? undefined,
    startDate: promotion.startDate.toISOString().slice(0, 10),
    endDate: promotion.endDate.toISOString().slice(0, 10),
    sortOrder: promotion.sortOrder,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit Promotion</h1>
      <PromotionForm events={events} initialData={initialData} />
    </div>
  );
}
