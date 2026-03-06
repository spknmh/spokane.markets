import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { SITE_NAME } from "@/lib/constants";
import { getBannerImages } from "@/lib/banner-images";
import { isBannerUnoptimized } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { CheckCircle2, Calendar } from "lucide-react";
import { formatNeighborhoodLabel } from "@/lib/utils";
import type { VerificationStatus } from "@prisma/client";
import { MarketsSearch } from "@/components/markets-search";

export const metadata: Metadata = {
  title: `Markets — ${SITE_NAME}`,
  description:
    "Discover farmers markets, craft fairs, and community markets in the Spokane area. Find locations, schedules, and vendor information.",
};

function truncate(str: string | null | undefined, len: number): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len).trim() + "…" : str;
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status !== "VERIFIED") return null;
  return (
    <Badge variant="default" className="gap-1">
      <CheckCircle2 className="h-3 w-3" aria-hidden />
      Verified
    </Badge>
  );
}

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();

  const banners = await getBannerImages();
  const markets = await db.market.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative -mx-4 mb-10 overflow-hidden rounded-xl sm:-mx-6 lg:-mx-8">
        <Image
          src={banners.farmersMarket}
          alt=""
          width={1200}
          height={400}
          className="h-52 w-full object-cover sm:h-64"
          unoptimized={isBannerUnoptimized(banners.farmersMarket)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
          <div className="inline-block max-w-2xl rounded-lg bg-black/50 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">
              Markets
            </h1>
            <p className="mt-1 text-base text-white/95 sm:text-lg">
              Explore verified markets and recurring venues across the Spokane area.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <MarketsSearch defaultValue={q} />
      </div>

      {markets.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {q ? `No markets found for "${q}". Try a different search.` : "No markets yet. Check back soon!"}
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {markets.length} market{markets.length !== 1 ? "s" : ""} found
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {markets.map((market) => (
          <Link key={market.id} href={`/markets/${market.slug}`}>
            <Card className="h-full border-2 transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className="font-sans text-lg font-bold text-foreground">{market.name}</CardTitle>
                  {market.baseArea && (
                    <Badge variant="outline" className="mt-2">
                      {formatNeighborhoodLabel(market.baseArea)}
                    </Badge>
                  )}
                </div>
                {market.verificationStatus === "VERIFIED" && (
                  <div className="shrink-0">
                    <VerificationBadge status={market.verificationStatus} />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {market.typicalSchedule && (
                  <div className="flex items-start gap-2 text-sm text-foreground">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span>{market.typicalSchedule}</span>
                  </div>
                )}
                {market.description && (
                  <p className="line-clamp-2 text-sm font-medium text-foreground">
                    {truncate(market.description, 120)}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
          </div>
        </>
      )}
    </div>
  );
}
