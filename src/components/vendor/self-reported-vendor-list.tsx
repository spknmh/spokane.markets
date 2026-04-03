import Link from "next/link";
import Image from "next/image";
import type { VerificationStatus } from "@prisma/client";
import { VendorVerifiedBadge } from "@/components/vendor/vendor-verified-badge";

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  imageUrl: string | null;
  specialties: string | null;
  verificationStatus?: VerificationStatus;
}

interface SelfReportedVendorListProps {
  /** Vendors who opted into public name listing on the event page. */
  publicVendors: Vendor[];
  /** Vendors attending/interested but with PRIVATE visibility (count-only on the public page). */
  privateVendorCount: number;
  showNames: boolean;
}

export function SelfReportedVendorList({
  publicVendors,
  privateVendorCount,
  showNames,
}: SelfReportedVendorListProps) {
  const total = publicVendors.length + privateVendorCount;
  if (total === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">
        Vendors Planning to Attend (Self-reported)
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Self-reported attendance is not organizer-confirmed.
      </p>
      {!showNames ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {total} vendor{total !== 1 ? "s" : ""} planning to attend.
        </p>
      ) : publicVendors.length > 0 ? (
        <>
          <ul className="mt-2 space-y-2">
            {publicVendors.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/vendors/${v.slug}`}
                  className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted"
                >
                  {v.imageUrl ? (
                    <Image
                      src={v.imageUrl}
                      alt={v.businessName}
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                      {v.businessName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
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
                </Link>
              </li>
            ))}
          </ul>
          {privateVendorCount > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {privateVendorCount} other vendor{privateVendorCount !== 1 ? "s" : ""} asked not to be listed by name
              on this page.
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          {privateVendorCount} vendor{privateVendorCount !== 1 ? "s" : ""} planning to attend (names hidden by vendor
          choice).
        </p>
      )}
    </div>
  );
}
