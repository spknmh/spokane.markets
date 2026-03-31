import Link from "next/link";
import type { ComponentType } from "react";
import type { PromotionType, VendorProfile } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Handshake, Star } from "lucide-react";
import { VendorVerifiedBadge } from "@/components/vendor/vendor-verified-badge";
import { AvatarImage } from "@/components/media";

const PROMOTION_CONFIG: Record<
  PromotionType,
  { label: string; icon: ComponentType<{ className?: string }> }
> = {
  SPONSORED: { label: "Sponsored", icon: Megaphone },
  PARTNERSHIP: { label: "Partner Spotlight", icon: Handshake },
  FEATURED: { label: "Featured", icon: Star },
};

interface FeaturedVendorCardProps {
  vendor: VendorProfile;
  promotionType: PromotionType;
  sponsorName?: string | null;
}

export function FeaturedVendorCard({
  vendor,
  promotionType,
  sponsorName,
}: FeaturedVendorCardProps) {
  const config = PROMOTION_CONFIG[promotionType];
  const Icon = config.icon;

  return (
    <Link href={`/vendors/${vendor.slug}`} prefetch={false} className="group block">
      <Card className="relative h-full min-h-[140px] overflow-hidden border-2 border-accent/40 bg-accent/5 transition-all hover:border-accent/60 hover:bg-accent/10 hover:shadow-lg">
        <Badge
          variant="secondary"
          className="absolute right-3 top-3 z-10 flex items-center gap-1.5 text-[11px]"
        >
          <Icon className="h-3 w-3" />
          {config.label}
          {sponsorName && (
            <span className="text-muted-foreground">· {sponsorName}</span>
          )}
        </Badge>
        <CardContent className="flex gap-4 p-5">
          {vendor.imageUrl ? (
            <AvatarImage
              src={vendor.imageUrl}
              alt={vendor.businessName}
              className="h-20 w-20 rounded-lg"
              focalX={vendor.imageFocalX}
              focalY={vendor.imageFocalY}
              sizes="80px"
              pixelSize={96}
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10 text-2xl font-bold text-primary">
              {vendor.businessName.charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1.5 pt-6">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="line-clamp-2 min-w-0 flex-1 font-sans text-lg font-bold leading-tight text-foreground group-hover:text-primary">
                {vendor.businessName}
              </h3>
              <VendorVerifiedBadge status={vendor.verificationStatus} className="self-start" />
            </div>
            {vendor.specialties && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {vendor.specialties}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
