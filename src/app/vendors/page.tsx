import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SITE_NAME } from "@/lib/constants";
import { db } from "@/lib/db";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { getBannerImages } from "@/lib/banner-images";
import { isBannerUnoptimized } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FavoriteVendorButton } from "@/components/vendor/favorite-vendor-button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { VendorSocialLinks } from "@/components/vendor-social-links";
import { VendorsSearch } from "@/components/vendor/vendors-search";
import { VendorOfWeekCard } from "@/components/vendor/vendor-of-week-card";
import { VendorVerifiedBadge } from "@/components/vendor/vendor-verified-badge";
import { getVendorOfWeek } from "@/lib/vendor-of-week";
import { MediaFrame } from "@/components/media";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 24;

export const metadata: Metadata = {
  title: `Vendors — ${SITE_NAME}`,
  description:
    "Browse local vendors at Spokane markets and craft fairs. Find artisans, food vendors, and small businesses.",
};

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
        deletedAt: null,
        OR: [
          { businessName: { contains: q, mode: "insensitive" as const } },
          { specialties: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : { deletedAt: null };

  const [session, vendors, totalCount, banners, vendorOfWeek] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    db.vendorProfile.findMany({
      where,
      orderBy: { businessName: "asc" },
      include: { _count: { select: { favoriteVendors: true } } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.vendorProfile.count({ where }),
    getBannerImages(),
    getVendorOfWeek(),
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const showVendorOfWeek = !q && page === 1 && !!vendorOfWeek;
  const vendorIds = vendors.map((vendor) => vendor.id);
  const now = new Date();
  const [upcomingEventCounts, pastEventCounts] = vendorIds.length
    ? await Promise.all([
        db.vendorEvent.groupBy({
          by: ["vendorProfileId"],
          where: {
            vendorProfileId: { in: vendorIds },
            event: {
              deletedAt: null,
              status: "PUBLISHED",
              startDate: { gte: now },
            },
          },
          _count: { _all: true },
        }),
        db.vendorEvent.groupBy({
          by: ["vendorProfileId"],
          where: {
            vendorProfileId: { in: vendorIds },
            event: {
              deletedAt: null,
              status: "PUBLISHED",
              startDate: { lt: now },
            },
          },
          _count: { _all: true },
        }),
      ])
    : [[], []];
  const upcomingEventCountByVendor = new Map(
    upcomingEventCounts.map((row) => [row.vendorProfileId, row._count._all])
  );
  const pastEventCountByVendor = new Map(
    pastEventCounts.map((row) => [row.vendorProfileId, row._count._all])
  );
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
          src={banners.localVendor.url}
          alt="Local vendors at Spokane markets"
          width={1200}
          height={400}
          className="h-52 w-full object-cover sm:h-64"
          style={{ objectPosition: banners.localVendor.objectPosition }}
          unoptimized={isBannerUnoptimized(banners.localVendor.url)}
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

      {showVendorOfWeek && vendorOfWeek && (
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Vendor of the Week</h2>
            <p className="mt-1 text-muted-foreground">
              A standout local vendor we think you should check out
            </p>
          </div>
          <VendorOfWeekCard vendor={vendorOfWeek} />
        </section>
      )}

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-xl">Own this kind of profile?</CardTitle>
            <p className="text-sm text-muted-foreground">
              Create your vendor profile to showcase your business and share where you&apos;ll be next.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/vendor/profile/edit" prefetch={false}>
                Create Vendor Profile
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Run a market or event series?</CardTitle>
            <p className="text-sm text-muted-foreground">
              Get started as an organizer by creating your market profile.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/organizer/markets/new" prefetch={false}>
                Create Market
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {vendors.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {q ? `No vendors found for "${q}". Try a different search.` : "No vendor profiles yet. Check back soon!"}
        </p>
      ) : (
        <>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Card
              key={vendor.id}
              className="relative h-full overflow-hidden border-2 transition-all hover:shadow-lg hover:border-primary/50"
            >
              <Link href={`/vendors/${vendor.slug}`} prefetch={false} className="block">
                {vendor.imageUrl ? (
                  <MediaFrame
                    src={vendor.imageUrl}
                    alt={vendor.businessName}
                    aspect="16/9"
                    focalX={vendor.imageFocalX}
                    focalY={vendor.imageFocalY}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="rounded-t-lg"
                  />
                ) : (
                  <div className="flex aspect-[16/9] w-full shrink-0 items-center justify-center bg-primary/10 text-4xl font-bold text-primary">
                    {vendor.businessName.charAt(0)}
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 pr-12">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                      <CardTitle className="font-sans line-clamp-2 min-w-0 flex-1 text-lg font-bold text-foreground">
                        {vendor.businessName}
                      </CardTitle>
                      <VendorVerifiedBadge status={vendor.verificationStatus} />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="shrink-0">
                      {upcomingEventCountByVendor.get(vendor.id) ?? 0} upcoming
                    </Badge>
                    <Badge variant="outline" className="shrink-0">
                      {pastEventCountByVendor.get(vendor.id) ?? 0} past
                    </Badge>
                    <Badge variant="outline" className="shrink-0">
                      {vendor._count.favoriteVendors} likes
                    </Badge>
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
                        vendorId={vendor.slug}
                        websiteUrl={vendor.websiteUrl}
                        facebookUrl={vendor.facebookUrl}
                        instagramUrl={vendor.instagramUrl}
                        iconOnly
                        stopPropagation
                      />
                    )}
                  </CardContent>
                )}
              </Link>
              <div className="absolute right-2 top-2 z-10">
                <FavoriteVendorButton
                  slug={vendor.slug}
                  initialFavorited={favoriteIds.includes(vendor.id)}
                  iconOnly
                  isLoggedIn={!!session?.user}
                  className="rounded-full bg-background/80 shadow-sm backdrop-blur-sm"
                  callbackUrl={(() => {
                    const p = new URLSearchParams();
                    if (q) p.set("q", q);
                    if (page > 1) p.set("page", String(page));
                    const qs = p.toString();
                    return qs ? `/vendors?${qs}` : "/vendors";
                  })()}
                />
              </div>
            </Card>
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
