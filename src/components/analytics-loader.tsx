"use client";

import dynamic from "next/dynamic";

const AnalyticsProvider = dynamic(
  () => import("@/components/analytics-provider").then((m) => ({ default: m.AnalyticsProvider })),
  { ssr: false }
);

export function AnalyticsLoader({ children }: { children: React.ReactNode }) {
  return <AnalyticsProvider>{children}</AnalyticsProvider>;
}
