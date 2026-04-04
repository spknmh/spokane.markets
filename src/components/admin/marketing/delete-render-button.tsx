"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteRenderButton({ renderId }: { renderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this render from history?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/marketing/renders/${renderId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? "Delete failed");
      }
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="destructive" onClick={onDelete} disabled={busy}>
      {busy ? "Deleting..." : "Delete"}
    </Button>
  );
}
