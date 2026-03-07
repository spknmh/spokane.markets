"use client";

import { useEffect } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { usePageDuration } from "@/hooks/use-page-duration";
import { Button } from "@/components/ui/button";

interface MaintenanceLink {
  label: string;
  url: string;
}

interface MaintenanceTrackerProps {
  links: MaintenanceLink[];
}

/** Client component that tracks maintenance_view, maintenance_link_click, maintenance_duration. */
export function MaintenanceTracker({ links }: MaintenanceTrackerProps) {
  usePageDuration("maintenance_duration", { minSeconds: 1 });

  useEffect(() => {
    trackEvent("maintenance_view");
  }, []);

  const handleLinkClick = (link: MaintenanceLink) => {
    trackEvent("maintenance_link_click", {
      link_label: link.label,
    });
  };

  const hasLinks = links.length > 0;

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
      {hasLinks ? (
        links.map((link) => (
          <Button key={link.url} asChild variant="outline" size="lg">
            <Link
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLinkClick(link)}
            >
              {link.label}
            </Link>
          </Button>
        ))
      ) : (
        <Button asChild variant="outline" size="lg">
          <Link
            href="/auth/signin"
            onClick={() =>
              trackEvent("maintenance_link_click", {
                link_label: "Admin login",
              })
            }
          >
            Admin login
          </Link>
        </Button>
      )}
    </div>
  );
}
