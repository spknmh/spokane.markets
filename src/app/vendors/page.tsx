import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Pagination } from "@/components/pagination";
import { getBannerImages } from "@/lib/banner-images";
import { isBannerUnoptimized } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FavoriteVendorButton } from "@/components/favorite-vendor-button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { VendorSocialLinks } from "@/components/vendor-social-links";
import { VendorsSearch } from "@/components/vendors-search";

const DEFAULT_LIMIT = 24;

function truncate(str: string | null | undefined, len: number): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len).trim() + "\u2026" : str;
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
  const q = (params.q ?? "").trim();

  const where = q
    ? {
        OR: [
          { businessName: { contains: q, mode: "insensitive" as const } },
          { specialties: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [session, vendors, totalCount, banners] = await Promise.all([
    auth(),
    db.vendorProfile.findMany({
      where,
      orderBy: { businessName: "asc" },
      include: { _count: { select: { vendorEvents: true } } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.vendorProfile.count({ where }),
    getBannerImages(),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

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
      <div className="relative -mx-4 mb-10 overflow-hidden rounded-xl sm:-mx-6 lg:-mx-8">
        <Image
          src={banners.localVendor}
          alt=""
          width={1200}
          height={400}
          className="h-52 w-full object-cover sm:h-64"
          unoptimized={isBannerUnoptimized(banners.localVendor)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
          <div className="inline-block max-w-2xl rounded-lg bg-black/50 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">
              Vendors
            </h1>
            <p className="mt-1 text-base text-white/95 sm:text-lg">
              Meet your local makers and vendors. See where they&apos;ll be next.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <VendorsSearch defaultValue={q} />
      </div>

      {vendors.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {q ? `No vendors found for "${q}". Try a different search.` : "No vendor profiles yet. Check back soon!"}
        </p>
      ) : (
        <>
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
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalCount}
          limit={limit}
        />
        </>
      )}
    </div>
  );
}
