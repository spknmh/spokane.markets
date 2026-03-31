import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";
import {
  formatPhoneNumber,
  getFacebookDisplayUrl,
  getInstagramDisplayUrl,
  normalizeUrlToHttps,
} from "@/lib/utils";
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
import {
  mergeUpcomingPublicVendorEvents,
  VENDOR_PROFILE_INTENT_STATUSES,
} from "@/lib/vendor-public-events";
import { VendorVerifiedBadge } from "@/components/vendor/vendor-verified-badge";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const eventCardInclude = {
  venue: true,
  tags: true,
  features: true,
  _count: { select: { vendorEvents: true } },
  scheduleDays: { orderBy: { date: "asc" as const } },
} as const;

async function getVendor(slug: string) {
  return db.vendorProfile.findFirst({
    where: { slug, deletedAt: null },
    include: {
      vendorEvents: {
        where: {
          event: {
            deletedAt: null,
          },
        },
        include: {
          event: {
            include: eventCardInclude,
          },
        },
        orderBy: { event: { startDate: "asc" } },
      },
      vendorIntents: {
        where: {
          status: { in: VENDOR_PROFILE_INTENT_STATUSES },
          event: { deletedAt: null },
        },
        include: {
          event: {
            include: eventCardInclude,
          },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getVendor(slug);

  if (!vendor) {
    return { title: "Vendor Not Found" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const description = vendor.description ?? `${vendor.businessName} — a local vendor on ${SITE_NAME}.`;
  const vendorImage =
    vendor.imageUrl?.startsWith("http")
      ? vendor.imageUrl
      : vendor.imageUrl
        ? `${baseUrl}${vendor.imageUrl.startsWith("/") ? "" : "/"}${vendor.imageUrl}`
        : undefined;
  return {
    title: `${vendor.businessName} | ${SITE_NAME}`,
    description,
    alternates: { canonical: `${baseUrl}/vendors/${slug}` },
    openGraph: {
      title: vendor.businessName,
      description,
      images: vendorImage ? [{ url: vendorImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: vendor.businessName,
      description,
      images: vendorImage ? [{ url: vendorImage }] : undefined,
    },
  };
}

export default async function VendorProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const [vendor, session] = await Promise.all([
    getVendor(slug),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (!vendor) {
    notFound();
  }

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

  const upcomingEvents = mergeUpcomingPublicVendorEvents(
    vendor.vendorEvents.map((ve) => ve.event),
    vendor.vendorIntents.map((vi) => vi.event),
  );

  const firstSpecialty = vendor.specialties?.split(",")[0]?.trim();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const vendorUrl = `${baseUrl}/vendors/${vendor.slug}`;
  const vendorImage =
    vendor.imageUrl?.startsWith("http")
      ? vendor.imageUrl
      : vendor.imageUrl
        ? `${baseUrl}${vendor.imageUrl.startsWith("/") ? "" : "/"}${vendor.imageUrl}`
        : undefined;
  const sameAs = [
    vendor.websiteUrl ? normalizeUrlToHttps(vendor.websiteUrl) : null,
    getFacebookDisplayUrl(vendor.facebookUrl),
    getInstagramDisplayUrl(vendor.instagramUrl),
  ].filter((u): u is string => !!u);
  const vendorJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: vendor.businessName,
    description: vendor.description ?? undefined,
    url: vendorUrl,
    image: vendorImage,
    ...(sameAs.length > 0 && { sameAs }),
    ...(vendor.contactEmail && { email: vendor.contactEmail }),
    ...(vendor.contactPhone && { telephone: vendor.contactPhone }),
  };
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vendorJsonLd) }}
      />
      <TrackVendorView
        vendorId={vendor.id}
        category={firstSpecialty ? firstSpecialty.toLowerCase().replace(/\s+/g, "-") : undefined}
      />
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {vendor.imageUrl ? (
              <Image
                src={vendor.imageUrl}
                alt={vendor.businessName}
                width={192}
                height={192}
                className="h-40 w-40 shrink-0 rounded-xl object-cover sm:h-48 sm:w-48"
                unoptimized
              />
            ) : (
              <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-4xl font-bold text-primary sm:h-48 sm:w-48">
                {vendor.businessName.charAt(0)}
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {vendor.businessName}
                </h1>
                <VendorVerifiedBadge status={vendor.verificationStatus} size="md" />
              </div>

              {vendor.specialties && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {vendor.specialties.split(",").map((s) => (
                    <Badge key={s.trim()} variant="secondary">
                      {s.trim()}
                    </Badge>
                  ))}
                </div>
              )}

              {vendor.description && (
                <p className="mt-4 whitespace-pre-line text-muted-foreground">
                  {vendor.description}
                </p>
              )}
            </div>
          </div>

          {(vendor.galleryUrls?.length ?? 0) > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold">Gallery</h2>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
                {vendor.galleryUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative h-48 shrink-0 overflow-hidden rounded-lg border border-border sm:h-40"
                  >
                    <Image
                      src={url}
                      alt={`${vendor.businessName} gallery ${i + 1}`}
                      width={400}
                      height={300}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-xl font-semibold">
              Where We&apos;ll Be Next
            </h2>

            {upcomingEvents.length === 0 ? (
              <Card className="mt-4">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No upcoming events scheduled. Check back soon!
                </CardContent>
              </Card>
            ) : (
              <div className="mt-4 space-y-3">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-80 lg:sticky lg:top-24">
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-6">
            <FavoriteVendorButton
              slug={vendor.slug}
              initialFavorited={!!favorite}
              initialEmailAlerts={favorite?.emailAlerts ?? true}
              isLoggedIn={!!session?.user}
              callbackUrl={`/vendors/${vendor.slug}`}
            />
            {vendor.socialLinksVisible !== false && (
              <VendorSocialLinks
                vendorId={vendor.id}
                websiteUrl={vendor.websiteUrl}
                facebookUrl={vendor.facebookUrl}
                instagramUrl={vendor.instagramUrl}
              />
            )}

            {vendor.contactVisible !== false &&
              (vendor.contactEmail || vendor.contactPhone) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact</p>
                <div className="mt-1 space-y-0.5 text-sm">
                  {vendor.contactEmail && (
                    <p>
                      <a
                        href={`mailto:${vendor.contactEmail}`}
                        className="min-h-[44px] inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <Mail className="h-4 w-4 shrink-0" />
                        {vendor.contactEmail}
                      </a>
                    </p>
                  )}
                  {vendor.contactPhone && (
                    <p>
                      <a
                        href={`tel:${vendor.contactPhone.replace(/\D/g, "")}`}
                        className="min-h-[44px] inline-flex items-center gap-2 text-foreground hover:underline"
                      >
                        <Phone className="h-4 w-4 shrink-0" />
                        {formatPhoneNumber(vendor.contactPhone)}
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
