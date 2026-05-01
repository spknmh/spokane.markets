import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  await requireAdmin();

  const [tags, features] = await Promise.all([
    db.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { events: true } } },
    }),
    db.feature.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { events: true } } },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Tags &amp; Features
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage event tags (e.g. Farmers Market, Craft Fair) and features/amenities
          (e.g. Indoor, WiFi Available). These appear in filters and on event cards.
          The slug is auto-generated from the name.
        </p>
      </div>

      <CategoriesManager initialTags={tags} initialFeatures={features} />
    </div>
  );
}
