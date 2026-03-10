"use client";

import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import type { AnalyticsParams } from "@/lib/analytics";
import { trackEvent } from "@/lib/analytics";

interface TrackedExternalLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> {
  href: string;
  eventName: string;
  eventParams?: AnalyticsParams;
  children: ReactNode;
}

export const TrackedExternalLink = forwardRef<
  HTMLAnchorElement,
  TrackedExternalLinkProps
>(function TrackedExternalLink(
  { href, eventName, eventParams, children, ...props },
  ref
) {
  return (
    <a
      ref={ref}
      href={href}
      onClick={() => trackEvent(eventName, eventParams)}
      {...props}
    >
      {children}
    </a>
  );
});
