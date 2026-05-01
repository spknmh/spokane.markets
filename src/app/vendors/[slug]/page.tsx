import { AvatarImage, MediaFrame } from "@/components/media";
import { Mail, Phone } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";
import { formatPhoneNumber } from "@/lib/utils";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { FavoriteVendorButton } from "@/components/vendor/favorite-vendor-button";
import { VendorSocialLinks } from "@/components/vendor-social-links";
import { Card, CardContent } from "@/components/ui/card";
import { EventCard } from "@/components/event/event-card";
import { ReportButton } from "@/components/report-button";
import { ShareButton } from "@/components/share-button";
import { TrackVendorView } from "@/components/track-content-view";
import { VendorVerifiedBadge } from "@/components/vendor/vendor-verified-badge";
import { CommunityBadgeChips } from "@/components/community-badge-chips";
import {
  buildVendorProfileJsonLd,
  toPublicVendorProfile,
} from "@/lib/vendor-public-profile";
import {
  getVendorAppearances,
  splitAppearancesByTime,
} from "@/lib/services/vendor-appearances";
import { getAttendanceCountsByEventIds } from "@/lib/attendance-counts";
import { getVendorParticipationCountsByEventIds } from "@/lib/event-vendor-participation-count";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getVendorBySlug(slug: string) {
  return db.vendorProfile.findFirst({
    where: { slug, deletedAt: null },
    include: {
      listingCommunityBadges: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, slug: true, name: true, icon: true },
      },
    },
  });
}

function absUrl(baseUrl: string, url: string | null | undefined) {
  if (!url?.trim()) return undefined;
  if (url.startsWith("http")) return url;
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);

  if (!vendor) {
    return { title: "Vendor Not Found" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const description =
    vendor.description ?? `${vendor.businessName} — a local vendor on ${SITE_NAME}.`;
  const ogImage =
    absUrl(baseUrl, vendor.heroImageUrl) ??
    absUrl(baseUrl, vendor.imageUrl);
  return {
    title: `${vendor.businessName} | ${SITE_NAME}`,
    description,
    alternates: { canonical: `${baseUrl}/vendors/${slug}` },
    openGraph: {
      title: vendor.businessName,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: vendor.businessName,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

export default async function VendorProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const [vendor, session] = await Promise.all([
    getVendorBySlug(slug),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (!vendor) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicVendor = toPublicVendorProfile(vendor, baseUrl);
  const vendorJsonLd = buildVendorProfileJsonLd(publicVendor, baseUrl);
  const vendorUrl = `${baseUrl}/vendors/${vendor.slug}`;

  const { rows: appearanceRows } = await getVendorAppearances(vendor.id);
  const { upcoming, past } = splitAppearancesByTime(appearanceRows);

  const appearanceEventIds = [...upcoming, ...past].map((r) => r.event.id);
  const [attendanceMap, vendorParticipationMap] = await Promise.all([
    getAttendanceCountsByEventIds(appearanceEventIds),
    getVendorParticipationCountsByEventIds(appearanceEventIds),
  ]);

  const favorite = session?.user
    ? await db.favoriteVendor.findUnique({
        where: {
          userId_vendorProfileId: {
            userId: session.user.id!,
            vendorProfileId: vendor.id,
          },
        },
      })
    : null;

  const categoryTag =
    vendor.primaryCategory?.trim() ||
    vendor.specialties?.split(",")[0]?.trim();
  const specialtyTags =
    vendor.specialties
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const heroSrc =
    vendor.heroImageUrl?.trim() ||
    (vendor.imageUrl?.trim() ? vendor.imageUrl : null);
  const showHeroFocal = Boolean(vendor.heroImageUrl?.trim());

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vendorJsonLd) }}
      />
      <TrackVendorView
        vendorId={vendor.id}
        category={categoryTag ? categoryTag.toLowerCase().replace(/\s+/g, "-") : undefined}
      />

      {/* Hero + overlapping avatar */}
      <div className="relative mb-6 overflow-hidden rounded-xl ring-1 ring-border sm:mb-8">
        {heroSrc ? (
          vendor.heroImageUrl?.trim() ? (
            <div className="relative h-48 w-full sm:h-64">
              <Image
                src={heroSrc}
                alt={`${vendor.businessName} — cover`}
                fill
                className="object-cover"
                style={{
                  objectPosition: `${showHeroFocal ? vendor.heroImageFocalX : 50}% ${showHeroFocal ? vendor.heroImageFocalY : 50}%`,
                }}
                priority
                unoptimized={heroSrc.startsWith("/uploads/") || heroSrc.startsWith("http")}
              />
            </div>
          ) : (
            <div className="relative h-48 w-full sm:h-64">
              <AvatarImage
                src={heroSrc}
                alt=""
                className="h-full w-full rounded-none"
                focalX={vendor.imageFocalX}
                focalY={vendor.imageFocalY}
                sizes="100vw"
                pixelSize={1200}
              />
            </div>
          )
        ) : (
          <div className="h-32 bg-gradient-to-br from-primary/15 to-muted sm:h-40" />
        )}
        <div className="relative flex flex-col gap-4 px-4 pb-4 pt-2 sm:flex-row sm:items-end sm:px-6 sm:pb-6">
          <div className="-mt-14 shrink-0 sm:-mt-16">
            {vendor.imageUrl ? (
              <AvatarImage
                src={vendor.imageUrl}
                alt={vendor.businessName}
                className="h-28 w-28 rounded-xl border-4 border-background shadow-md ring-1 ring-border sm:h-32 sm:w-32"
                focalX={vendor.imageFocalX}
                focalY={vendor.imageFocalY}
                sizes="(max-width: 640px) 112px, 128px"
                pixelSize={128}
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-xl border-4 border-background bg-primary/20 text-3xl font-bold text-primary shadow-md ring-1 ring-border sm:h-32 sm:w-32">
                {vendor.businessName.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {vendor.businessName}
              </h1>
              <VendorVerifiedBadge status={vendor.verificationStatus} size="md" />
            </div>
            {vendor.primaryCategory?.trim() && (
              <Badge className="mt-2" variant="secondary">
                {vendor.primaryCategory.trim()}
              </Badge>
            )}
            {specialtyTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {specialtyTags.map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
            {vendor.serviceAreaLabel?.trim() && (
              <p className="mt-2 text-sm text-muted-foreground">
                Serves {vendor.serviceAreaLabel.trim()}
              </p>
            )}
            {vendor.listingCommunityBadges.length > 0 && (
              <div className="mt-3 space-y-2">
                <CommunityBadgeChips badges={vendor.listingCommunityBadges} />
                <p className="text-xs text-muted-foreground">
                  Inclusion badges are self-identified by the business.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1">
          {vendor.description && (
            <section>
              <h2 className="text-lg font-semibold">About</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">
                {vendor.description}
              </p>
            </section>
          )}

          {(vendor.galleryUrls?.length ?? 0) > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold">What we offer</h2>
              <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] sm:grid sm:grid-cols-2 sm:overflow-visible sm:snap-none lg:grid-cols-3">
                {vendor.galleryUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-[min(280px,85vw)] shrink-0 snap-start overflow-hidden rounded-lg border border-border sm:w-auto sm:min-w-0"
                  >
                    <MediaFrame
                      src={url}
                      alt={`${vendor.businessName} gallery ${i + 1}`}
                      aspect="4/3"
                      objectFit="contain"
                      sizes="(max-width: 640px) 85vw, (max-width: 1024px) 40vw, 25vw"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-xl font-semibold">Where we&apos;ll be next</h2>
            {upcoming.length === 0 ? (
              <Card className="mt-4">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No upcoming dates listed yet. Save this vendor to hear about future events when
                  they&apos;re added.
                </CardContent>
              </Card>
            ) : (
              <div className="mt-4 space-y-4">
                {upcoming.map((row) => (
                  <EventCard
                    key={row.event.id}
                    event={{
                      ...row.event,
                      attendance: attendanceMap[row.event.id],
                      vendorParticipationCount: vendorParticipationMap[row.event.id],
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold">Seen at</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Past appearances on Spokane Markets (from listings and your activity).
              </p>
              <div className="mt-4 space-y-4">
                {past.map((row) => (
                  <EventCard
                    key={row.event.id}
                    event={{
                      ...row.event,
                      attendance: attendanceMap[row.event.id],
                      vendorParticipationCount: vendorParticipationMap[row.event.id],
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="w-full shrink-0 lg:w-80 lg:sticky lg:top-24">
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-6">
            <FavoriteVendorButton
              slug={vendor.slug}
              initialFavorited={!!favorite}
              initialEmailAlerts={favorite?.emailAlerts ?? true}
              isLoggedIn={!!session?.user}
              callbackUrl={`/vendors/${vendor.slug}`}
            />
            {vendor.socialLinksVisible === true && (
              <VendorSocialLinks
                vendorId={vendor.id}
                websiteUrl={publicVendor.websiteUrl}
                facebookUrl={publicVendor.facebookUrl}
                instagramUrl={publicVendor.instagramUrl}
              />
            )}

            {vendor.contactVisible === true &&
              (publicVendor.contactEmail || publicVendor.contactPhone) && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact</p>
                  <div className="mt-1 space-y-0.5 text-sm">
                    {publicVendor.contactEmail && (
                      <p>
                        <a
                          href={`mailto:${publicVendor.contactEmail}`}
                          className="inline-flex min-h-[44px] items-center gap-2 text-primary hover:underline"
                        >
                          <Mail className="h-4 w-4 shrink-0" />
                          {publicVendor.contactEmail}
                        </a>
                      </p>
                    )}
                    {publicVendor.contactPhone && (
                      <p>
                        <a
                          href={`tel:${publicVendor.contactPhone.replace(/\D/g, "")}`}
                          className="inline-flex min-h-[44px] items-center gap-2 text-foreground hover:underline"
                        >
                          <Phone className="h-4 w-4 shrink-0" />
                          {formatPhoneNumber(publicVendor.contactPhone)}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between gap-3">
                <ShareButton
                  url={vendorUrl}
                  title={vendor.businessName}
                  text={vendor.description ?? undefined}
                  analyticsEventName="vendor_share_click"
                  analyticsParams={{ vendor_id: vendor.id, surface: "detail_page" }}
                />
                <ReportButton
                  targetType="VENDOR"
                  targetId={vendor.id}
                  isLoggedIn={!!session?.user}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
