import Link from "next/link";
import Image from "next/image";
import type { VendorOfWeek } from "@/lib/vendor-of-week";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VendorSocialLinks } from "@/components/vendor-social-links";
import { VendorVerifiedBadge } from "@/components/vendor/vendor-verified-badge";

interface VendorOfWeekCardProps {
  vendor: VendorOfWeek;
}

export function VendorOfWeekCard({ vendor }: VendorOfWeekCardProps) {
  const shortDescription =
    vendor.description && vendor.description.length > 260
      ? `${vendor.description.slice(0, 257).trim()}...`
      : vendor.description;

  return (
    <Card className="overflow-hidden border-2 border-primary/30 bg-primary/5">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-[minmax(260px,36%)_1fr]">
          <div className="relative aspect-[16/9] w-full bg-muted md:aspect-auto md:min-h-[320px]">
            {vendor.imageUrl ? (
              <Image
                src={vendor.imageUrl}
                alt={vendor.businessName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 36vw"
                unoptimized={vendor.imageUrl.startsWith("/uploads/") || vendor.imageUrl.startsWith("http")}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl font-bold text-primary/60">
                {vendor.businessName.charAt(0)}
              </div>
            )}
          </div>

          <div className="space-y-4 p-6 md:p-8">
            <div className="space-y-2">
              <Badge variant="secondary" className="text-[11px] uppercase tracking-wide">
                Vendor of the Week
              </Badge>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-sans text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {vendor.businessName}
                </h3>
                <VendorVerifiedBadge status={vendor.verificationStatus} size="md" />
              </div>
              {vendor.specialties && (
                <p className="text-sm font-medium text-foreground">{vendor.specialties}</p>
              )}
            </div>

            {shortDescription && (
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                {shortDescription}
              </p>
            )}

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-background px-3 py-1">
                {vendor._count.vendorEvents} event{vendor._count.vendorEvents === 1 ? "" : "s"} participated
              </span>
              <span className="rounded-full border border-border bg-background px-3 py-1">
                {vendor._count.favoriteVendors} follower{vendor._count.favoriteVendors === 1 ? "" : "s"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link href={`/vendors/${vendor.slug}`} prefetch={false}>
                  View Vendor
                </Link>
              </Button>
              <VendorSocialLinks
                vendorId={vendor.slug}
                websiteUrl={vendor.websiteUrl}
                facebookUrl={vendor.facebookUrl}
                instagramUrl={vendor.instagramUrl}
                iconOnly
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
