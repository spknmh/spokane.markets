import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getBannerImages } from "@/lib/banner-images";
import { isBannerUnoptimized } from "@/lib/utils";
import { getSession } from "@/lib/auth-utils";
import { getDirectionsUrl } from "@/lib/utils";
import { EventTimeLabel } from "@/components/event-time-label";
import { MapPreview } from "@/components/map-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttendanceToggle } from "@/components/attendance-toggle";
import { ReviewList } from "@/components/review-list";
import { WriteReviewButton } from "@/components/write-review-button";
import { ShareButton } from "@/components/share-button";
import { AddToCalendar } from "@/components/add-to-calendar";
import { ReportButton } from "@/components/report-button";
import { OfficialVendorRoster } from "@/components/official-vendor-roster";
import { SelfReportedVendorList } from "@/components/self-reported-vendor-list";
import { EventVendorActions } from "@/components/event-vendor-actions";
import { getParticipationConfig } from "@/lib/participation-config";
import { SITE_NAME } from "@/lib/constants";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getEvent(slug: string) {
  return db.event.findUnique({
    where: { slug },
    include: {
      venue: true,
      market: true,
      tags: true,
      features: true,
      attendances: true,
      vendorEvents: {
        include: {
          vendorProfile: {
            select: { id: true, businessName: true, slug: true, imageUrl: true, specialties: true },
          },
        },
      },
      vendorRoster: {
        where: { status: { in: ["INVITED", "ACCEPTED", "CONFIRMED"] } },
        include: {
          vendorProfile: {
            select: { id: true, businessName: true, slug: true, imageUrl: true, specialties: true },
          },
        },
      },
      vendorIntents: {
        where: {
          status: { in: ["ATTENDING", "INTERESTED"] },
          visibility: "PUBLIC",
        },
        include: {
          vendorProfile: {
            select: { id: true, businessName: true, slug: true, imageUrl: true, specialties: true },
          },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) return { title: "Event Not Found" };

  return {
    title: `${event.title} — ${(await import("@/lib/constants")).SITE_NAME}`,
    description:
      event.description?.slice(0, 160) ??
      `${event.title} at ${event.venue.name}. Find details, directions, and more on ${SITE_NAME}.`,
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 160) ?? undefined,
      images: event.imageUrl ? [{ url: event.imageUrl }] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const [event, banners] = await Promise.all([getEvent(slug), getBannerImages()]);

  if (!event || event.status !== "PUBLISHED") {
    notFound();
  }

  const fullAddress = `${event.venue.address}, ${event.venue.city}, ${event.venue.state} ${event.venue.zip}`;
  const directionsUrl = getDirectionsUrl(fullAddress);

  const goingCount = event.attendances.filter((a) => a.status === "GOING").length;
  const interestedCount = event.attendances.filter((a) => a.status === "INTERESTED").length;

  const session = await getSession();
  const vendorProfile = session?.user
    ? await db.vendorProfile.findUnique({
        where: { userId: session.user.id! },
        select: { id: true },
      })
    : null;

  const [userAttendance, userIntent] = session?.user
    ? await Promise.all([
        db.attendance.findUnique({
          where: { userId_eventId: { userId: session.user.id!, eventId: event.id } },
        }),
        vendorProfile
          ? db.eventVendorIntent.findUnique({
              where: {
                eventId_vendorProfileId: {
                  eventId: event.id,
                  vendorProfileId: vendorProfile.id,
                },
              },
            })
          : Promise.resolve(null),
      ])
    : [null, null];

  const participationConfig = getParticipationConfig(event);

  const officialVendors =
    event.vendorRoster.length > 0
      ? event.vendorRoster.map((r) => r.vendorProfile)
      : event.vendorEvents.map((ve) => ve.vendorProfile);

  const officialIds = new Set(officialVendors.map((v) => v.id));
  const selfReportedVendors = event.vendorIntents
    .map((i) => i.vendorProfile)
    .filter((v) => !officialIds.has(v.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link href="/events" className="transition-colors hover:text-primary">
              Events
            </Link>
            <span className="mx-2">·</span>
            <span className="text-foreground">{event.title}</span>
          </nav>

          <div className="overflow-hidden rounded-lg ring-1 ring-border">
            {event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt={event.title}
                className="h-64 w-full object-cover sm:h-80"
              />
            ) : (
              <Image
                src={banners.events}
                alt=""
                width={800}
                height={320}
                className="h-64 w-full object-cover sm:h-80"
                unoptimized={isBannerUnoptimized(banners.events)}
              />
            )}
          </div>

          <h1 className="mt-6 font-sans text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {event.title}
          </h1>

          {event.description && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-foreground">About this event</h2>
              <p className="mt-2 text-base leading-relaxed text-foreground whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {(event.websiteUrl || event.facebookUrl) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {event.websiteUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={event.websiteUrl} target="_blank" rel="noopener noreferrer">
                    Website ↗
                  </a>
                </Button>
              )}
              {event.facebookUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={event.facebookUrl} target="_blank" rel="noopener noreferrer">
                    Facebook ↗
                  </a>
                </Button>
              )}
            </div>
          )}

          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Reviews</h2>
              <WriteReviewButton eventId={event.id} isLoggedIn={!!session?.user} callbackUrl={`/events/${event.slug}`} />
            </div>
            <ReviewList eventId={event.id} isLoggedIn={!!session?.user} />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-80 lg:sticky lg:top-24">
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">When</p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">
                <EventTimeLabel
                  startDate={event.startDate}
                  endDate={event.endDate}
                  timezone={event.timezone}
                />
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Where</p>
              <p className="mt-0.5 font-semibold text-foreground">{event.venue.name}</p>
              <p className="mt-0.5 text-sm text-foreground">{fullAddress}</p>
              <MapPreview
                lat={event.venue.lat}
                lng={event.venue.lng}
                address={fullAddress}
                className="mt-2"
              />
              {event.venue.parkingNotes && (
                <p className="mt-1 text-sm text-muted-foreground">
                  🅿️ {event.venue.parkingNotes}
                </p>
              )}
              <Button size="sm" variant="outline" className="mt-2 min-h-[44px]" asChild>
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                  Get Directions →
                </a>
              </Button>
            </div>

            <ShareButton
              url={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/events/${event.slug}`}
              title={event.title}
              text={event.description ?? undefined}
            />

            <AddToCalendar
              event={{
                id: event.id,
                title: event.title,
                slug: event.slug,
                description: event.description,
                startDate: event.startDate,
                endDate: event.endDate,
              }}
              venue={event.venue}
              eventPageUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/events/${event.slug}`}
            />

            {event.market && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Part of</p>
                <Link
                  href={`/markets/${event.market.slug}`}
                  className="mt-0.5 block font-semibold text-primary hover:underline"
                >
                  {event.market.name}
                </Link>
              </div>
            )}

            <OfficialVendorRoster
              vendors={officialVendors}
              capacity={participationConfig.vendorCapacity}
              publicRosterEnabled={participationConfig.publicRosterEnabled}
            />

            {participationConfig.publicIntentListEnabled &&
              selfReportedVendors.length > 0 && (
                <SelfReportedVendorList
                  vendors={selfReportedVendors}
                  count={selfReportedVendors.length}
                  showNames={participationConfig.publicIntentNamesEnabled}
                />
              )}

            <EventVendorActions
              eventId={event.id}
              mode={participationConfig.mode}
              isLoggedIn={!!session?.user}
              hasVendorProfile={!!vendorProfile}
              userIntent={userIntent?.status ?? null}
              callbackUrl={`/events/${event.slug}`}
            />

            <AttendanceToggle
              eventId={event.id}
              slug={event.slug}
              initialGoingCount={goingCount}
              initialInterestedCount={interestedCount}
              initialUserStatus={userAttendance?.status ?? null}
              isLoggedIn={!!session?.user}
              callbackUrl={`/events/${event.slug}`}
            />

            <ReportButton
              targetType="EVENT"
              targetId={event.id}
              isLoggedIn={!!session?.user}
            />

            {(event.tags.length > 0 || event.features.length > 0) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {event.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                  {event.features.map((feature) => (
                    <Badge key={feature.id} variant="outline">
                      {feature.icon && <span className="mr-0.5">{feature.icon}</span>}
                      {feature.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
