import Link from "next/link";
import type { VerificationStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { VendorVerifiedBadge } from "@/components/vendor/vendor-verified-badge";
import { AvatarImage } from "@/components/media";

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  imageUrl: string | null;
  imageFocalX?: number;
  imageFocalY?: number;
  specialties: string | null;
  /** Present when the query selects it (see event-occurrence-service). */
  verificationStatus?: VerificationStatus;
}

interface OfficialVendorRosterProps {
  vendors: Vendor[];
  capacity?: number | null;
  publicRosterEnabled: boolean;
}

export function OfficialVendorRoster({
  vendors,
  capacity,
  publicRosterEnabled,
}: OfficialVendorRosterProps) {
  if (!publicRosterEnabled && vendors.length === 0) return null;

  const displayVendors = publicRosterEnabled ? vendors : [];
  const count = displayVendors.length;

  if (count === 0 && !capacity) return null;

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">
        Official Vendors (Organizer Verified)
        {capacity != null && (
          <span className="ml-1 font-normal">
            — {count} of {capacity} slots
          </span>
        )}
      </p>
      {count === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No official vendors yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {displayVendors.map((v) => (
            <li key={v.id}>
              <Link
                href={`/vendors/${v.slug}`}
                className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted"
              >
                {v.imageUrl ? (
                  <AvatarImage
                    src={v.imageUrl}
                    alt={v.businessName}
                    className="h-10 w-10 shrink-0 rounded-full"
                    focalX={v.imageFocalX}
                    focalY={v.imageFocalY}
                    sizes="40px"
                    pixelSize={40}
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                    {v.businessName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5 font-medium text-foreground">
                    {v.businessName}
                    <VendorVerifiedBadge status={v.verificationStatus ?? "UNVERIFIED"} />
                  </span>
                  {v.specialties && (
                    <p className="truncate text-xs text-muted-foreground">
                      {v.specialties.split(",")[0]?.trim()}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  Official
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
