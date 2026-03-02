import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { COMMUNITY_IMAGES } from "@/lib/community-images";
import { getSession } from "@/lib/auth-utils";
import { formatDateRange, getDirectionsUrl, getCompletenessScore } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttendanceToggle } from "@/components/attendance-toggle";
import { ReviewList } from "@/components/review-list";
import { WriteReviewButton } from "@/components/write-review-button";

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
    },
  });
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) return { title: "Event Not Found" };

  return {
    title: `${event.title} — Spokane Markets`,
    description:
      event.description?.slice(0, 160) ??
      `${event.title} at ${event.venue.name}. Find details, directions, and more on Spokane Markets.`,
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 160) ?? undefined,
      images: event.imageUrl ? [{ url: event.imageUrl }] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event || event.status !== "PUBLISHED") {
    notFound();
  }

  const fullAddress = `${event.venue.address}, ${event.venue.city}, ${event.venue.state} ${event.venue.zip}`;
  const directionsUrl = getDirectionsUrl(fullAddress);
  const { score, total } = getCompletenessScore(event);

  const goingCount = event.attendances.filter((a) => a.status === "GOING").length;
  const interestedCount = event.attendances.filter((a) => a.status === "INTERESTED").length;

  const session = await getSession();
  const userAttendance = session?.user
    ? await db.attendance.findUnique({
        where: { userId_eventId: { userId: session.user.id!, eventId: event.id } },
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/events" className="transition-colors hover:text-primary">
          Events
        </Link>
        <span className="mx-2">·</span>
        <span className="text-foreground">{event.title}</span>
      </nav>

      {/* Image */}
      <div className="mb-6 overflow-hidden rounded-lg ring-1 ring-border">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-64 w-full object-cover sm:h-80"
          />
        ) : (
          <Image
            src={COMMUNITY_IMAGES.events}
            alt=""
            width={800}
            height={320}
            className="h-64 w-full object-cover sm:h-80"
          />
        )}
      </div>

      {/* Title & Date */}
      <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {formatDateRange(event.startDate, event.endDate)}
      </p>

      {/* Venue */}
      <div className="mt-6 rounded-lg border border-border p-4">
        <h2 className="font-semibold">{event.venue.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{fullAddress}</p>
        {event.venue.neighborhood && (
          <Badge variant="secondary" className="mt-2">
            {event.venue.neighborhood}
          </Badge>
        )}
        {event.venue.parkingNotes && (
          <p className="mt-2 text-sm text-muted-foreground">
            🅿️ {event.venue.parkingNotes}
          </p>
        )}
        <div className="mt-3">
          <Button size="sm" variant="outline" asChild>
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
              Get Directions →
            </a>
          </Button>
        </div>
      </div>

      {/* Market association */}
      {event.market && (
        <div className="mt-4 rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Part of</p>
          <Link
            href={`/markets/${event.market.slug}`}
            className="text-lg font-semibold text-primary hover:underline"
          >
            {event.market.name}
          </Link>
        </div>
      )}

      {/* Tags & Features */}
      <div className="mt-6 space-y-3">
        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <Badge key={tag.id}>{tag.name}</Badge>
            ))}
          </div>
        )}
        {event.features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.features.map((feature) => (
              <Badge key={feature.id} variant="outline">
                {feature.icon && <span className="mr-1">{feature.icon}</span>}
                {feature.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Completeness Score */}
      <div className="mt-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Info completeness
          </span>
          <span className="text-sm font-semibold">
            {score}/{total}
          </span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(score / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Attendance */}
      <AttendanceToggle
        eventId={event.id}
        slug={event.slug}
        initialGoingCount={goingCount}
        initialInterestedCount={interestedCount}
        initialUserStatus={userAttendance?.status ?? null}
      />

      {/* Description */}
      {event.description && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">About this event</h2>
          <p className="mt-2 whitespace-pre-line text-muted-foreground">
            {event.description}
          </p>
        </div>
      )}

      {/* External Links */}
      {(event.websiteUrl || event.facebookUrl) && (
        <div className="mt-8 flex flex-wrap gap-3">
          {event.websiteUrl && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={event.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Website ↗
              </a>
            </Button>
          )}
          {event.facebookUrl && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={event.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook ↗
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Reviews */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Reviews</h2>
          <WriteReviewButton eventId={event.id} isLoggedIn={!!session?.user} />
        </div>
        <ReviewList eventId={event.id} />
      </div>
    </div>
  );
}
