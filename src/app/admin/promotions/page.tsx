import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/action-buttons";
import { deletePromotion } from "../actions";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { PromotionType } from "@prisma/client";

const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  SPONSORED: "Sponsored",
  PARTNERSHIP: "Partner Spotlight",
  FEATURED: "Featured",
};

export default async function AdminPromotionsPage() {
  await requireAdmin();

  const promotions = await db.promotion.findMany({
    include: {
      event: {
        select: { id: true, title: true, slug: true, startDate: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
        <Button asChild>
          <Link href="/admin/promotions/new">New Promotion</Link>
        </Button>
      </div>

      <p className="text-muted-foreground">
        Manage featured, sponsored, and partner market dates shown in the home page
        carousel.
      </p>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left font-medium">Market Date</th>
              <th className="p-3 text-left font-medium">Type</th>
              <th className="p-3 text-left font-medium">Sponsor</th>
              <th className="p-3 text-left font-medium">Display Period</th>
              <th className="p-3 text-left font-medium">Order</th>
              <th className="p-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {promotions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No promotions yet. Create one to feature market dates on the home
                  page.
                </td>
              </tr>
            ) : (
              promotions.map((p) => {
                const isActive =
                  p.startDate <= now && p.endDate >= now && p.event;
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="p-3 font-medium">
                      {p.event ? (
                        <Link
                          href={`/events/${p.event.slug}`}
                          className="text-primary hover:underline"
                        >
                          {p.event.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">
                        {PROMOTION_TYPE_LABELS[p.type]}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {p.sponsorName || "—"}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatDate(p.startDate)} – {formatDate(p.endDate)}
                      {isActive && (
                        <Badge variant="default" className="ml-2 text-xs">
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{p.sortOrder}</td>
                    <td className="space-x-2 p-3 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/promotions/${p.id}/edit`}>Edit</Link>
                      </Button>
                      <DeleteButton
                        action={deletePromotion.bind(null, p.id)}
                        title="Delete promotion"
                        description="Are you sure? This will remove the promotion from the home page carousel."
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
