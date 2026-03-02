import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { COMMUNITY_IMAGES } from "@/lib/community-images";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
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
  const markets = await db.market.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative mb-10 overflow-hidden rounded-xl">
        <Image
          src={COMMUNITY_IMAGES.farmersMarket}
          alt=""
          width={1200}
          height={300}
          className="h-40 w-full object-cover sm:h-48"
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
            <Card className="h-full transition-all hover:shadow-lg hover:border-primary/30">
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <CardTitle className="line-clamp-2">{market.name}</CardTitle>
                <div className="flex shrink-0 flex-wrap gap-1">
                  {market.baseArea && (
                    <Badge variant="outline">{market.baseArea}</Badge>
                  )}
                  <VerificationBadge status={market.verificationStatus} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {market.typicalSchedule && (
                  <p className="text-sm text-muted-foreground">
                    {market.typicalSchedule}
                  </p>
                )}
                {market.description && (
                  <CardDescription className="line-clamp-2">
                    {truncate(market.description, 120)}
                  </CardDescription>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
