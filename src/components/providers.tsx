"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ConsentBanner } from "@/components/consent-banner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <SessionProvider refetchInterval={60} refetchOnWindowFocus={true}>
        {children}
        <ConsentBanner />
      </SessionProvider>
    </ThemeProvider>
  );
}
