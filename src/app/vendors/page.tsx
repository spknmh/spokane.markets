import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { COMMUNITY_IMAGES } from "@/lib/community-images";
import { Badge } from "@/components/ui/badge";
import { FavoriteVendorButton } from "@/components/favorite-vendor-button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { VendorSocialLinks } from "@/components/vendor-social-links";

function truncate(str: string | null | undefined, len: number): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len).trim() + "\u2026" : str;
}

export default async function VendorsPage() {
  const [session, vendors] = await Promise.all([
    auth(),
    db.vendorProfile.findMany({
      orderBy: { businessName: "asc" },
      include: { _count: { select: { vendorEvents: true } } },
    }),
  ]);

  const favoriteIds = session?.user
    ? (
        await db.favoriteVendor.findMany({
          where: {
            userId: session.user.id!,
            vendorProfileId: { in: vendors.map((v) => v.id) },
          },
          select: { vendorProfileId: true },
        })
      ).map((f) => f.vendorProfileId)
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative mb-10 overflow-hidden rounded-xl">
        <Image
          src={COMMUNITY_IMAGES.localVendor}
          alt=""
          width={1200}
          height={300}
          className="h-40 w-full object-cover sm:h-48"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Vendors
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground sm:text-base">
            Meet your local makers and vendors. See where they&apos;ll be next.
          </p>
        </div>
      </div>

      {vendors.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No vendor profiles yet. Check back soon!
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Link key={vendor.id} href={`/vendors/${vendor.slug}`}>
              <Card className="h-full border-2 transition-all hover:shadow-lg hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-sans line-clamp-2 text-lg font-bold text-foreground">
                      {vendor.businessName}
                    </CardTitle>
                    <div className="flex shrink-0 items-center gap-2">
                      {session?.user && (
                        <FavoriteVendorButton
                          slug={vendor.slug}
                          initialFavorited={favoriteIds.includes(vendor.id)}
                          iconOnly
                          stopPropagation
                        />
                      )}
                      {vendor._count.vendorEvents > 0 && (
                        <Badge variant="secondary">
                          {vendor._count.vendorEvents} event
                          {vendor._count.vendorEvents !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {vendor.specialties && (
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">
                      {vendor.specialties}
                    </p>
                  )}
                </CardHeader>
                {(vendor.description ||
                  vendor.websiteUrl ||
                  vendor.facebookUrl ||
                  vendor.instagramUrl) && (
                  <CardContent className="space-y-2">
                    {vendor.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {truncate(vendor.description, 140)}
                      </p>
                    )}
                    {(vendor.websiteUrl ||
                      vendor.facebookUrl ||
                      vendor.instagramUrl) && (
                      <VendorSocialLinks
                        websiteUrl={vendor.websiteUrl}
                        facebookUrl={vendor.facebookUrl}
                        instagramUrl={vendor.instagramUrl}
                        iconOnly
                        stopPropagation
                      />
                    )}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
