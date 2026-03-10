import Link from "next/link";
import { notFound } from "next/navigation";
import { findMarketBySlug } from "@/lib/services/market-series-service";
import { getSession } from "@/lib/auth-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Calendar, CheckCircle2, ExternalLink, Facebook, Instagram, MapPin, Mail, Phone } from "lucide-react";
import { formatDateRangeInTimezone, formatNeighborhoodLabel, formatPhoneNumber, getDirectionsUrl } from "@/lib/utils";
import { MapPreviewLazy as MapPreview } from "@/components/event/map-preview-lazy";
import { ReviewList } from "@/components/review-list";
import { WriteReviewButton } from "@/components/write-review-button";
import { ReportButton } from "@/components/report-button";
import { TrackMarketView } from "@/components/track-content-view";
import { ClaimMarketButton } from "@/components/vendor/claim-market-button";
import type { Metadata } from "next";
import type { VerificationStatus } from "@prisma/client";
import { SITE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status !== "VERIFIED") return null;
  return (
    <Badge variant="default" className="gap-1">
      <CheckCircle2 className="h-3 w-3" aria-hidden />
      Verified
    </Badge>
  );
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const market = await findMarketBySlug(slug);
  if (!market) return { title: "Market Not Found" };
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const description = market.description ?? `Discover ${market.name} and upcoming events in the Spokane area.`;
  const marketImage =
    market.imageUrl?.startsWith("http")
      ? market.imageUrl
      : market.imageUrl
        ? `${baseUrl}${market.imageUrl.startsWith("/") ? "" : "/"}${market.imageUrl}`
        : undefined;
  return {
    title: `${market.name} — ${SITE_NAME}`,
    description,
    alternates: { canonical: `${baseUrl}/markets/${slug}` },
    openGraph: {
      title: market.name,
      description,
      images: marketImage ? [{ url: marketImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: market.name,
      description,
      images: marketImage ? [{ url: marketImage }] : undefined,
    },
  };
}

export default async function MarketDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const market = await findMarketBySlug(slug);

  if (!market) notFound();

  const session = await getSession();
  const fullAddress = `${market.venue.address}, ${market.venue.city}, ${market.venue.state} ${market.venue.zip}`;
  const directionsUrl = getDirectionsUrl(fullAddress);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const marketUrl = `${baseUrl}/markets/${market.slug}`;
  const marketImage =
    market.imageUrl?.startsWith("http")
      ? market.imageUrl
      : market.imageUrl
        ? `${baseUrl}${market.imageUrl.startsWith("/") ? "" : "/"}${market.imageUrl}`
        : undefined;

  const marketJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: market.name,
    description: market.description ?? undefined,
    url: marketUrl,
    image: marketImage,
    address: {
      "@type": "PostalAddress",
      streetAddress: market.venue.address,
      addressLocality: market.venue.city,
      addressRegion: market.venue.state,
      postalCode: market.venue.zip,
    },
    ...(market.websiteUrl && { sameAs: [market.websiteUrl] }),
    ...(market.contactEmail && { email: market.contactEmail }),
    ...(market.contactPhone && { telephone: market.contactPhone }),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(marketJsonLd) }}
      />
      <TrackMarketView
        marketId={market.id}
        neighborhood={market.venue?.neighborhood ?? market.baseArea ?? undefined}
      />
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{market.name}</h1>
            <VerificationBadge status={market.verificationStatus} />
            {market.baseArea && (
              <Badge variant="outline">{formatNeighborhoodLabel(market.baseArea)}</Badge>
            )}
          </div>

          {market.description && (
            <div className="mb-8">
              <h2 className="mb-2 text-lg font-semibold">About</h2>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {market.description}
              </p>
            </div>
          )}

          {market.events.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">Upcoming Events</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {market.events.map((event) => (
                  <Link key={event.id} href={`/events/${event.slug}`}>
                    <Card className="h-full transition-all hover:shadow-lg hover:border-primary/30">
                      <CardHeader>
                        <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                        <CardDescription>
                          {formatDateRangeInTimezone(event.startDate, event.endDate, null)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {event.venue.name}
                          {event.venue.address && ` · ${event.venue.address}`}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Reviews</h2>
              <WriteReviewButton marketId={market.id} isLoggedIn={!!session?.user} callbackUrl={`/markets/${market.slug}`} />
            </div>
            <ReviewList marketId={market.id} isLoggedIn={!!session?.user} />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-80 lg:sticky lg:top-24">
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-5">
            <ReportButton
              targetType="MARKET"
              targetId={market.id}
              isLoggedIn={!!session?.user}
            />
            {market.typicalSchedule && (
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Schedule</p>
                  <p className="mt-0.5 text-foreground">{market.typicalSchedule}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="mt-0.5 font-semibold text-foreground">{market.venue.name}</p>
                <p className="mt-0.5 text-sm text-foreground">{fullAddress}</p>
                <MapPreview
                  lat={market.venue.lat}
                  lng={market.venue.lng}
                  address={fullAddress}
                  className="mt-2"
                />
                {market.venue.parkingNotes && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    🅿️ {market.venue.parkingNotes}
                  </p>
                )}
                <Button size="sm" variant="outline" className="mt-2 min-h-[44px]" asChild>
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                    Get Directions →
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {market.websiteUrl && (
                <a
                  href={market.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Website
                </a>
              )}
              {market.facebookUrl && (
                <a
                  href={market.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Facebook className="h-4 w-4" aria-hidden />
                  Facebook
                </a>
              )}
              {market.instagramUrl && (
                <a
                  href={market.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Instagram className="h-4 w-4" aria-hidden />
                  Instagram
                </a>
              )}
            </div>

            {(market.contactEmail || market.contactPhone) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact</p>
                <div className="mt-1 space-y-0.5 text-sm">
                  {market.contactEmail && (
                    <p>
                      <a
                        href={`mailto:${market.contactEmail}`}
                        className="inline-flex min-h-[44px] items-center gap-2 text-primary hover:underline"
                      >
                        <Mail className="h-4 w-4 shrink-0" />
                        {market.contactEmail}
                      </a>
                    </p>
                  )}
                  {market.contactPhone && (
                    <p>
                      <a
                        href={`tel:${market.contactPhone.replace(/\D/g, "")}`}
                        className="inline-flex min-h-[44px] items-center gap-2 text-foreground hover:underline"
                      >
                        <Phone className="h-4 w-4 shrink-0" />
                        {formatPhoneNumber(market.contactPhone)}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {market.verificationStatus !== "VERIFIED" && (
              <ClaimMarketButton
                marketId={market.id}
                marketSlug={market.slug}
                session={session}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
