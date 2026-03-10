"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { isValidCallbackUrl } from "@/lib/utils";

/**
 * Post-auth redirect: sends VENDOR users without a profile to /vendor/dashboard.
 * Others go to the `next` param or /.
 */
export default function AuthRedirectPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const safeNext = isValidCallbackUrl(next) ? next : "/";

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace(safeNext);
      return;
    }

    const role = (session.user as { role?: string }).role ?? "USER";
    if (role !== "VENDOR" && role !== "ADMIN") {
      router.replace(safeNext);
      return;
    }

    // VENDOR/ADMIN: check if they have a complete vendor profile
    fetch("/api/account/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.vendor) {
          router.replace(safeNext);
          return;
        }
        if (!data.vendor.profileComplete) {
          router.replace("/vendor/dashboard");
        } else {
          router.replace(safeNext);
        }
      })
      .catch(() => router.replace(safeNext));
  }, [session, isPending, router, safeNext]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <p className="text-muted-foreground">Redirecting…</p>
    </div>
  );
}
