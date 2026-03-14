"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RequestVerificationButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRequest() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/vendor/verification", { method: "POST" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to submit verification request.");
        }
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to submit verification request.",
        );
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleRequest} disabled={isPending}>
        {isPending ? "Requesting..." : "Request Verification"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
