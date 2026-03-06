"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { gtag } from "@/lib/analytics";
import { ConsentBanner } from "@/components/consent-banner";

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GA_DEBUG = process.env.NEXT_PUBLIC_GA_DEBUG === "1";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const session = useSession();

  useEffect(() => {
    if (!MEASUREMENT_ID || typeof window === "undefined") return;
    gtag("event", "page_view", {
      page_path: pathname,
      page_title: document.title,
    } as Record<string, unknown>);
  }, [pathname]);

  useEffect(() => {
    if (!MEASUREMENT_ID || typeof window === "undefined") return;
    const user = session.data?.user;
    const role = (user?.role as string)?.toLowerCase() ?? "consumer";
    const hasVendorProfile =
      !!user && "hasVendorProfile" in user
        ? (user as { hasVendorProfile?: boolean }).hasVendorProfile
        : false;

    gtag("set", "user_properties", {
      role,
      has_vendor_profile: hasVendorProfile,
    } as Record<string, unknown>);

    if (user && typeof window !== "undefined" && typeof window.sessionStorage !== "undefined") {
      const loginMethod = sessionStorage.getItem("login_method");
      if (loginMethod === "oauth") {
        sessionStorage.removeItem("login_method");
        gtag("event", "login_success", { method: "oauth" } as Record<string, unknown>);
      }
    }
  }, [session.data]);

  return (
    <>
      {MEASUREMENT_ID && (
        <>
          <Script
            id="ga-init"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied' });
            gtag('config', '${MEASUREMENT_ID}', { debug_mode: ${GA_DEBUG} });
          `,
            }}
          />
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
        </>
      )}
      <ConsentBanner />
      {children}
    </>
  );
}
