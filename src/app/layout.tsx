import type { Metadata } from "next";
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
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
      <body
        className={`${inter.className} ${inter.variable} ${fraunces.variable}`}
        data-theme={themeAttr}
      >
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
