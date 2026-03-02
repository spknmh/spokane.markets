import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";
import { AuthGate } from "@/components/auth-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { CheckCircle2, ExternalLink, Facebook, Instagram } from "lucide-react";
import { formatDateRange } from "@/lib/utils";
import { ReviewList } from "@/components/review-list";
import { WriteReviewButton } from "@/components/write-review-button";
import type { Metadata } from "next";
import type { VerificationStatus } from "@prisma/client";

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
  const market = await db.market.findUnique({
    where: { slug },
  });
  if (!market) return { title: "Market Not Found" };
  return {
    title: `${market.name} — Spokane Markets`,
    description: market.description ?? `Discover ${market.name} and upcoming events in the Spokane area.`,
  };
}

export default async function MarketDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const now = new Date();

  const market = await db.market.findUnique({
    where: { slug },
    include: {
      events: {
        where: {
          status: "PUBLISHED",
          startDate: { gte: now },
        },
        orderBy: { startDate: "asc" },
        take: 10,
        include: {
          venue: true,
        },
      },
    },
  });

  if (!market) notFound();

  const session = await getSession();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{market.name}</h1>
          <VerificationBadge status={market.verificationStatus} />
          {market.baseArea && (
            <Badge variant="outline">{market.baseArea}</Badge>
          )}
        </div>
        {market.typicalSchedule && (
          <p className="text-muted-foreground">{market.typicalSchedule}</p>
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

      <div className="mb-8 flex flex-wrap gap-4">
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
        <div className="mb-8">
          <h2 className="mb-2 text-lg font-semibold">Contact</h2>
          <div className="space-y-1 text-sm text-muted-foreground">
            {market.contactEmail && (
              <p>
                <a
                  href={`mailto:${market.contactEmail}`}
                  className="text-primary hover:underline"
                >
                  {market.contactEmail}
                </a>
              </p>
            )}
            {market.contactPhone && <p>{market.contactPhone}</p>}
          </div>
        </div>
      )}

      {market.verificationStatus !== "VERIFIED" && (
        <div className="mb-8">
          <AuthGate session={session} callbackUrl={`/markets/${market.slug}/claim`}>
            <Button asChild>
              <Link href={`/markets/${market.slug}/claim`}>Claim This Market</Link>
            </Button>
          </AuthGate>
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
                      {formatDateRange(event.startDate, event.endDate)}
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

      {/* Reviews */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Reviews</h2>
          <WriteReviewButton marketId={market.id} isLoggedIn={!!session?.user} />
        </div>
        <ReviewList marketId={market.id} />
      </div>
    </div>
  );
}
