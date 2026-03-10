"use client";

import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useEffect } from "react";
import { pushDataLayer } from "@/lib/analytics";
import { identifyUmami, trackUmamiPageview } from "@/lib/umami";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const UMAMI_PAGEVIEW_DEBOUNCE_MS = 150;

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const session = authClient.useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (GTM_ID) {
      pushDataLayer({
        event: "page_view",
        page_path: pathname,
        page_location: `${window.location.origin}${pathname}`,
        page_title: document.title,
      });
    }

    const timer = setTimeout(() => {
      const url = pathname + (typeof window !== "undefined" ? window.location.search : "");
      trackUmamiPageview(url);
    }, UMAMI_PAGEVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const user = session.data?.user as { id?: string; role?: string } | undefined;
    if (user?.id) {
      identifyUmami(user.id, { role: user.role ?? undefined });
    } else {
      identifyUmami(null);
    }

    if (!GTM_ID) return;
    const role = user?.role?.toLowerCase() ?? "consumer";
    const hasVendorProfile =
      !!user && "hasVendorProfile" in user
        ? (user as { hasVendorProfile?: boolean }).hasVendorProfile
        : false;

    pushDataLayer({
      event: "user_properties",
      role,
      has_vendor_profile: hasVendorProfile,
    });

    if (user && typeof window !== "undefined" && typeof window.sessionStorage !== "undefined") {
      const loginMethod = sessionStorage.getItem("login_method");
      if (loginMethod === "oauth") {
        sessionStorage.removeItem("login_method");
        pushDataLayer({ event: "login_success", method: "oauth" });
      }
    }
  }, [session.data]);

  return <>{children}</>;
}
