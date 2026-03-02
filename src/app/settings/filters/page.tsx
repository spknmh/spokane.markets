import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FilterDeleteButton } from "./filter-delete-button";

export const metadata: Metadata = {
  title: "Saved Filters — Spokane Markets",
};

export default async function SavedFiltersPage() {
  const session = await requireAuth();

  const filters = await db.savedFilter.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Saved Filters</h1>
      <p className="mt-1 text-muted-foreground">
        Manage your saved event filters and email alert preferences.
      </p>

      {filters.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-lg font-medium">No saved filters</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse{" "}
            <Link href="/events" className="text-primary hover:underline">
              events
            </Link>{" "}
            and save a filter to get started.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filters.map((filter) => {
            const filterParams = new URLSearchParams();
            if (filter.dateRange)
              filterParams.set("dateRange", filter.dateRange);
            if (filter.neighborhoods[0])
              filterParams.set("neighborhood", filter.neighborhoods[0]);
            if (filter.categories[0])
              filterParams.set("category", filter.categories[0]);
            if (filter.features[0])
              filterParams.set("feature", filter.features[0]);

            const summaryParts: string[] = [];
            if (filter.dateRange) summaryParts.push(filter.dateRange);
            if (filter.neighborhoods.length)
              summaryParts.push(filter.neighborhoods.join(", "));
            if (filter.categories.length)
              summaryParts.push(filter.categories.join(", "));
            if (filter.features.length)
              summaryParts.push(filter.features.join(", "));

            return (
              <Card key={filter.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/events?${filterParams.toString()}`}
                        className="font-medium transition-colors hover:text-primary"
                      >
                        {filter.name}
                      </Link>
                      {filter.emailAlerts && (
                        <Badge variant="outline">Email Alerts</Badge>
                      )}
                    </div>
                    {summaryParts.length > 0 && (
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {summaryParts.join(" · ")}
                      </p>
                    )}
                  </div>
                  <FilterDeleteButton filterId={filter.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
