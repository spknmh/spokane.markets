import Link from "next/link";
import { cn } from "@/lib/utils";

export const VENDOR_PROFILE_TABS = ["about", "photos", "activity"] as const;
export type VendorProfileTab = (typeof VENDOR_PROFILE_TABS)[number];

const TAB_LABELS: Record<VendorProfileTab, string> = {
  about: "About",
  photos: "Photos",
  activity: "Activity",
};

interface VendorProfileTabsProps {
  slug: string;
  activeTab: VendorProfileTab;
}

export function VendorProfileTabs({ slug, activeTab }: VendorProfileTabsProps) {
  return (
    <nav
      aria-label="Vendor profile sections"
      className="mt-3 flex items-center gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 sm:mt-4"
    >
      {VENDOR_PROFILE_TABS.map((tab) => (
        <Link
          key={tab}
          href={`/vendors/${slug}?tab=${tab}`}
          aria-current={activeTab === tab ? "page" : undefined}
          className={cn(
            "inline-flex min-h-[40px] shrink-0 items-center rounded-md px-3 text-sm font-medium transition-colors",
            activeTab === tab
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {TAB_LABELS[tab]}
        </Link>
      ))}
    </nav>
  );
}
