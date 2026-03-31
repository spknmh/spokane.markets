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
  verificationStatus: VerificationStatus;
}

interface SelfReportedVendorListProps {
  vendors: Vendor[];
  count: number;
  showNames: boolean;
}

export function SelfReportedVendorList({
  vendors,
  count,
  showNames,
}: SelfReportedVendorListProps) {
  if (count === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">
        Vendors Planning to Attend (Self-reported)
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Self-reported attendance is not organizer-confirmed.
      </p>
      {showNames ? (
        <ul className="mt-2 space-y-2">
          {vendors.map((v) => (
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
                    <VendorVerifiedBadge status={v.verificationStatus} />
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
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          {count} vendor{count !== 1 ? "s" : ""} planning to attend.
        </p>
      )}
    </div>
  );
}
