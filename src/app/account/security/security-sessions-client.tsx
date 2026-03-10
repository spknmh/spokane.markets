"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface SecuritySessionsClientProps {
  sessionCount: number;
}

export function SecuritySessionsClient({ sessionCount }: SecuritySessionsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOutOthers() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/sign-out-others", { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOutOthers}
      disabled={loading || sessionCount <= 1}
    >
      {loading ? "Signing out…" : "Sign out other sessions"}
    </Button>
  );
}
