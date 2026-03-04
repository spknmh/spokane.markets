import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { CategoriesManager } from "@/components/admin/categories-manager";

export default async function AdminCategoriesPage() {
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
          Categories & Features
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage event tags (categories) and features. These appear in filters
          and on event cards. Add new ones like &quot;WiFi Available&quot; as
          needed—the slug is auto-generated from the name.
        </p>
      </div>

      <CategoriesManager initialTags={tags} initialFeatures={features} />
    </div>
  );
}
