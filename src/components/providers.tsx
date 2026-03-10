"use client";

import { ThemeProvider } from "next-themes";
import { ConsentBanner } from "@/components/consent-banner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
      <ConsentBanner />
    </ThemeProvider>
  );
}
