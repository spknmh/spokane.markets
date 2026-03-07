"use client";

import { useEffect, useState } from "react";

/**
 * Debug page for analytics troubleshooting.
 * Visit /debug/analytics to inspect Umami/GTM state.
 * Remove or restrict in production.
 */
export default function AnalyticsDebugPage() {
  const [mounted, setMounted] = useState(false);
  const [umamiState, setUmamiState] = useState<Record<string, unknown>>({});
  const [gtmState, setGtmState] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const umami = (window as unknown as { umami?: unknown }).umami;
    const dataLayer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
    setUmamiState({
      exists: !!umami,
      type: typeof umami,
      keys: umami && typeof umami === "object" ? Object.keys(umami) : [],
      track: umami && typeof umami === "object" && "track" in umami ? typeof (umami as { track?: unknown }).track : "n/a",
      trackReady: typeof (umami && typeof umami === "object" && "track" in umami ? (umami as { track?: unknown }).track : null) === "function",
    });
    setGtmState({
      dataLayerExists: !!dataLayer,
      dataLayerLength: dataLayer?.length ?? 0,
    });
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const script = document.querySelector('script[data-website-id]');
    setUmamiState((prev) => ({
      ...prev,
      scriptLoaded: !!script,
      scriptSrc: script?.getAttribute("src") ?? null,
      dataDomains: script?.getAttribute("data-domains") ?? null,
    }));
  }, [mounted]);

  if (!mounted) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <h1 className="text-2xl font-bold">Analytics Debug</h1>
      <p className="text-sm text-muted-foreground">
        Use this page to troubleshoot Umami and GTM. Remove or restrict in production.
      </p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Umami</h2>
        <pre className="overflow-auto rounded bg-muted p-4 text-xs">
          {JSON.stringify(umamiState, null, 2)}
        </pre>
        <p className="text-xs text-muted-foreground">
          Umami v2 exposes only <code>track</code>. If <code>trackReady</code> is false, the script may not have loaded yet.
          Check that <code>data-domains</code> includes your current hostname ({typeof window !== "undefined" ? window.location.hostname : "—"}).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">GTM</h2>
        <pre className="overflow-auto rounded bg-muted p-4 text-xs">
          {JSON.stringify(gtmState, null, 2)}
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Env (client)</h2>
        <pre className="overflow-auto rounded bg-muted p-4 text-xs">
          {JSON.stringify(
            {
              NEXT_PUBLIC_UMAMI_WEBSITE_ID: !!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
              NEXT_PUBLIC_UMAMI_SCRIPT_URL: process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? "(default)",
              NEXT_PUBLIC_GTM_ID: !!process.env.NEXT_PUBLIC_GTM_ID,
            },
            null,
            2
          )}
        </pre>
      </section>
    </div>
  );
}
