"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { isValidCallbackUrl } from "@/lib/utils";

/**
 * Post-auth redirect: sends VENDOR users without a profile to /vendor/dashboard.
 * Others go to the `next` param or /.
 * Uses full-page redirect (window.location) to avoid client-side state that can
 * trigger prefetch loops when landing on the home page.
 */
export default function AuthRedirectPage() {
  const { data: session, isPending } = authClient.useSession();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const safeNext = isValidCallbackUrl(next) ? next : "/";

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      window.location.href = safeNext;
      return;
    }

    const role = (session.user as { role?: string }).role ?? "USER";
    if (role !== "VENDOR" && role !== "ADMIN") {
      window.location.href = safeNext;
      return;
    }

    // VENDOR/ADMIN: check if they have a complete vendor profile
    fetch("/api/account/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.vendor) {
          window.location.href = safeNext;
          return;
        }
        if (!data.vendor.profileComplete) {
          window.location.href = "/vendor/dashboard";
        } else {
          window.location.href = safeNext;
        }
      })
      .catch(() => {
        window.location.href = safeNext;
      });
  }, [session, isPending, safeNext]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <p className="text-muted-foreground">Redirecting…</p>
    </div>
  );
}
