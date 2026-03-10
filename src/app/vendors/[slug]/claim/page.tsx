import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { VendorClaimForm } from "@/components/vendor-claim-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClaimVendorPage({ params }: PageProps) {
  const { slug } = await params;

  const session = await requireAuth(`/vendors/${slug}/claim`);

  const vendor = await db.vendorProfile.findUnique({
    where: { slug },
    select: { id: true, businessName: true, slug: true, userId: true },
  });

  if (!vendor) return notFound();

  if (vendor.userId != null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Already Claimed</h1>
        <p className="mt-2 text-muted-foreground">
          This vendor has already been claimed.
        </p>
      </div>
    );
  }

  const existingClaim = await db.vendorClaimRequest.findFirst({
    where: {
      vendorProfileId: vendor.id,
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
          <CardTitle>Claim {vendor.businessName}</CardTitle>
          <CardDescription>
            Prove your ownership or management of this vendor to gain access to
            manage its profile and event listings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VendorClaimForm
            vendorProfileId={vendor.id}
            vendorName={vendor.businessName}
          />
        </CardContent>
      </Card>
    </div>
  );
}
