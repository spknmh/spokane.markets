import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Pagination } from "@/components/pagination";
import { SubscribersPageClient } from "@/components/admin/subscribers-page-client";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 25;

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? String(DEFAULT_LIMIT), 10)));

  const [total, subscribers] = await Promise.all([
    db.subscriber.count(),
    db.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Newsletter subscribers receive the weekly digest. Add manually or they
        sign up via the site.
      </p>
      <SubscribersPageClient subscribers={subscribers} />
      <Pagination page={page} totalPages={totalPages} totalItems={total} limit={limit} />
    </div>
  );
}
