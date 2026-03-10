"use client";

import { forwardRef } from "react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { AnalyticsParams } from "@/lib/analytics";
import { trackEvent } from "@/lib/analytics";

interface TrackedLinkProps
  extends Omit<ComponentProps<typeof Link>, "href" | "onClick"> {
  href: string;
  eventName: string;
  eventParams?: AnalyticsParams;
  children: ReactNode;
}

export const TrackedLink = forwardRef<HTMLAnchorElement, TrackedLinkProps>(
  function TrackedLink(
    { href, eventName, eventParams, children, ...props },
    ref
  ) {
    return (
      <Link
        ref={ref}
        href={href}
        onClick={() => trackEvent(eventName, eventParams)}
        {...props}
      >
        {children}
      </Link>
    );
  }
);
