import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getBannerImages } from "@/lib/banner-images";
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

export default async function MarketsPage() {
  const banners = await getBannerImages();
  const markets = await db.market.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative mb-10 overflow-hidden rounded-xl">
        <Image
          src={banners.farmersMarket}
          alt=""
          width={1200}
          height={300}
          className="h-40 w-full object-cover sm:h-48"
          unoptimized={banners.farmersMarket.startsWith("/uploads/")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Markets
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground sm:text-base">
            Explore verified markets and recurring venues across the Spokane area.
          </p>
        </div>
      </div>
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
    </div>
  );
}
