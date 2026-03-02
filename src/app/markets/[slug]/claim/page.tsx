import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { ClaimForm } from "@/components/claim-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClaimMarketPage({ params }: PageProps) {
  const session = await requireAuth();
  const { slug } = await params;

  const market = await db.market.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, verificationStatus: true },
  });

  if (!market) return notFound();

  if (market.verificationStatus === "VERIFIED") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Already Claimed</h1>
        <p className="mt-2 text-muted-foreground">
          This market has already been claimed and verified.
        </p>
      </div>
    );
  }

  const existingClaim = await db.claimRequest.findFirst({
    where: {
      marketId: market.id,
      userId: session.user.id,
      status: "PENDING",
    },
  });

  if (existingClaim) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Clock className="mx-auto mb-4 h-12 w-12 text-accent" />
        <h1 className="text-2xl font-bold tracking-tight">Claim Pending</h1>
        <p className="mt-2 text-muted-foreground">
          Your claim request is pending review. An admin will review it shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Claim {market.name}</CardTitle>
          <CardDescription>
            Prove your ownership or management of this market to gain verified
            status and manage its listings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClaimForm marketId={market.id} marketName={market.name} />
        </CardContent>
      </Card>
    </div>
  );
}
