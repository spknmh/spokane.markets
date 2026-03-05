import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { ConditionalChrome } from "@/components/conditional-chrome";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { COMMUNITY_IMAGES } from "@/lib/community-images";
import { SITE_NAME } from "@/lib/constants";

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

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${inter.variable} ${fraunces.variable}`}>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <Providers>
          <ConditionalChrome
            nav={<Navbar />}
            footer={<Footer />}
          >
            <main id="main" className="min-h-screen">{children}</main>
          </ConditionalChrome>
        </Providers>
      </body>
    </html>
  );
}
