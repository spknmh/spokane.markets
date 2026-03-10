"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { isValidCallbackUrl } from "@/lib/utils";

/**
 * Post-auth redirect: always sends the user to the `next` param (or /)
 * after signing in. Uses full-page redirect (window.location) to avoid
 * client-side state that can trigger prefetch loops.
 */
export default function AuthRedirectPage() {
  const { isPending } = authClient.useSession();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const safeNext = isValidCallbackUrl(next) ? next : "/";

  useEffect(() => {
    if (isPending) return;
    window.location.href = safeNext;
  }, [isPending, safeNext]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <p className="text-muted-foreground">Redirecting…</p>
    </div>
  );
}
