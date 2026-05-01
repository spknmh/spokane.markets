import { Mail, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommunityBadgeChips } from "@/components/community-badge-chips";
import { VendorSocialLinks } from "@/components/vendor-social-links";
import { formatPhoneNumber } from "@/lib/utils";

interface VendorProfileLeftRailProps {
  vendorId: string;
  primaryCategory: string | null;
  serviceAreaLabel: string | null;
  specialties: string[];
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  listingCommunityBadges: Array<{
    id: string;
    slug: string;
    name: string;
    icon: string | null;
  }>;
}

export function VendorProfileLeftRail({
  vendorId,
  primaryCategory,
  serviceAreaLabel,
  specialties,
  contactEmail,
  contactPhone,
  websiteUrl,
  facebookUrl,
  instagramUrl,
  listingCommunityBadges,
}: VendorProfileLeftRailProps) {
  const hasLinks = Boolean(websiteUrl || facebookUrl || instagramUrl);

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-80">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vendor details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {primaryCategory?.trim() && (
            <p>
              <span className="font-medium">Category:</span> {primaryCategory.trim()}
            </p>
          )}
          {serviceAreaLabel?.trim() && (
            <p className="inline-flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>Serves {serviceAreaLabel.trim()}</span>
            </p>
          )}
          {specialties.length > 0 && (
            <div>
              <p className="font-medium">Specialties</p>
              <p className="mt-1 text-muted-foreground">{specialties.join(", ")}</p>
            </div>
          )}
          {(contactEmail || contactPhone) && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="font-medium">Contact</p>
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex min-h-[44px] items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  {contactEmail}
                </a>
              )}
              {contactPhone && (
                <a
                  href={`tel:${contactPhone.replace(/\D/g, "")}`}
                  className="inline-flex min-h-[44px] items-center gap-2 text-foreground hover:underline"
                >
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {formatPhoneNumber(contactPhone)}
                </a>
              )}
            </div>
          )}

          {hasLinks && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="font-medium">Links</p>
              <VendorSocialLinks
                vendorId={vendorId}
                websiteUrl={websiteUrl}
                facebookUrl={facebookUrl}
                instagramUrl={instagramUrl}
              />
            </div>
          )}

          {listingCommunityBadges.length > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="font-medium">Community badges</p>
              <CommunityBadgeChips badges={listingCommunityBadges} />
              <p className="text-xs text-muted-foreground">
                Community badges are self-identified by this business.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
