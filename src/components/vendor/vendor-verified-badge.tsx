import { BadgeCheck } from "lucide-react";
import type { VerificationStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

/** Shown on hover/focus; keep in sync with product copy expectations. */
export const VENDOR_VERIFIED_BADGE_TOOLTIP =
  "Verified vendor — trusted locally, active at community events, and with a recognizable online presence.";

interface VendorVerifiedBadgeProps {
  status: VerificationStatus;
  className?: string;
  /** Compact for cards; slightly larger on profile hero. */
  size?: "sm" | "md";
}

export function VendorVerifiedBadge({
  status,
  className,
  size = "sm",
}: VendorVerifiedBadgeProps) {
  if (status !== "VERIFIED") return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full border border-emerald-600/35 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100",
        size === "md" && "px-2 py-1 text-[11px]",
        className
      )}
      title={VENDOR_VERIFIED_BADGE_TOOLTIP}
      aria-label={VENDOR_VERIFIED_BADGE_TOOLTIP}
    >
      <BadgeCheck
        className={cn(
          "shrink-0 text-emerald-700 dark:text-emerald-300",
          size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"
        )}
        aria-hidden
      />
      <span className="leading-none">Verified</span>
    </span>
  );
}
