"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Filter, CheckCircle2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "filters" | "rsvps" | "favorites";

const tabs: { value: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "filters", label: "Saved Filters", icon: Filter },
  { value: "rsvps", label: "My RSVPs", icon: CheckCircle2 },
  { value: "favorites", label: "Favorite Vendors", icon: Heart },
];

interface SavedPageTabsProps {
  activeTab: Tab;
}

export function SavedPageTabs({ activeTab }: SavedPageTabsProps) {
  const pathname = usePathname();

  return (
    <div className="mt-6 border-b border-border">
      <nav className="-mb-px flex gap-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const href = `${pathname}?tab=${tab.value}`;
          const isActive = activeTab === tab.value;

          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
