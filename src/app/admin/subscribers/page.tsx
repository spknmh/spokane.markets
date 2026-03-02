import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { SubscribersPageClient } from "@/components/admin/subscribers-page-client";

export default async function AdminSubscribersPage() {
  await requireAdmin();

  const subscribers = await db.subscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Newsletter subscribers receive the weekly digest. Add manually or they
        sign up via the site.
      </p>
      <SubscribersPageClient subscribers={subscribers} />
    </div>
  );
}
