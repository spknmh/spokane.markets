import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteVendorButton } from "@/components/favorite-vendor-button";
import { VendorSocialLinks } from "@/components/vendor-social-links";

export const metadata: Metadata = {
  title: "Favorite Vendors — Spokane Markets",
};

export default async function FavoriteVendorsPage() {
  const session = await requireAuth();

  const favorites = await db.favoriteVendor.findMany({
    where: { userId: session.user.id },
    include: {
      vendorProfile: {
        include: { _count: { select: { vendorEvents: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Favorite Vendors</h1>
      <p className="mt-1 text-muted-foreground">
        Vendors you follow. You&apos;ll get email alerts when they&apos;re added
        to new events.
      </p>

      {favorites.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-lg font-medium">No favorite vendors yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse{" "}
            <Link href="/vendors" className="text-primary hover:underline">
              vendors
            </Link>{" "}
            and click the heart to add them to your favorites.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {favorites.map((fav) => (
            <Card key={fav.id}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/vendors/${fav.vendorProfile.slug}`}
                      className="font-medium transition-colors hover:text-primary"
                    >
                      {fav.vendorProfile.businessName}
                    </Link>
                    {fav.emailAlerts && (
                      <Badge variant="outline">Email Alerts</Badge>
                    )}
                    {fav.vendorProfile._count.vendorEvents > 0 && (
                      <Badge variant="secondary">
                        {fav.vendorProfile._count.vendorEvents} event
                        {fav.vendorProfile._count.vendorEvents !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  {fav.vendorProfile.specialties && (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {fav.vendorProfile.specialties}
                    </p>
                  )}
                  <VendorSocialLinks
                    websiteUrl={fav.vendorProfile.websiteUrl}
                    facebookUrl={fav.vendorProfile.facebookUrl}
                    instagramUrl={fav.vendorProfile.instagramUrl}
                    iconOnly
                    className="mt-2"
                  />
                </div>
                <FavoriteVendorButton
                  slug={fav.vendorProfile.slug}
                  initialFavorited
                  initialEmailAlerts={fav.emailAlerts}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
