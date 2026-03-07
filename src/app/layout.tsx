import type { Metadata } from "next";
import Script from "next/script";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { ConditionalChrome } from "@/components/conditional-chrome";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { AnalyticsLoader } from "@/components/analytics-loader";
import { COMMUNITY_IMAGES } from "@/lib/community-images";
import { SITE_NAME } from "@/lib/constants";
import { getSiteTheme } from "@/lib/site-theme";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: false,
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "https://analytics.spokane.markets/a-smh.js";

/** Skip static prerender at build time; DB is unavailable in Docker build. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: `${SITE_NAME} — Discover Local Markets, Fairs & Events`,
  description:
    "The best way to find markets, craft fairs, and vendor events in the Spokane area. Filter by date, neighborhood, and category.",
  openGraph: {
    title: SITE_NAME,
    description: "Discover local markets, fairs & events in Spokane",
    type: "website",
    images: [{ url: COMMUNITY_IMAGES.hero, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "Discover local markets, fairs & events in Spokane",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getSiteTheme();
  const themeAttr = theme === "cedar" ? undefined : theme;

  return (
    <html lang="en" suppressHydrationWarning>
      {umamiWebsiteId && (
        <Script
          id="umami"
          src={umamiScriptUrl}
          data-website-id={umamiWebsiteId}
          strategy="beforeInteractive"
        />
      )}
      {gtmId && (
        <>
          <Script
            id="gtm-head"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'consent_default',analytics_storage:'denied',ad_storage:'denied'});(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        </>
      )}
      <body
        className={`${inter.className} ${inter.variable} ${fraunces.variable}`}
        data-theme={themeAttr}
      >
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        )}
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <Providers>
          <AnalyticsLoader>
          <ConditionalChrome
            nav={<Navbar />}
            footer={<Footer />}
          >
            <main id="main" className="min-h-screen">{children}</main>
          </ConditionalChrome>
          </AnalyticsLoader>
        </Providers>
      </body>
    </html>
  );
}
