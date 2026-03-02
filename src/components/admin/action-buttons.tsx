"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  label = "Delete",
}: {
  action: () => Promise<void>;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Are you sure you want to delete this?")) return;
        startTransition(() => action());
      }}
    >
      {isPending ? "Deleting..." : label}
    </Button>
  );
}

export function StatusButton({
  action,
  label,
  variant = "default",
}: {
  action: () => Promise<void>;
  label: string;
  variant?: "default" | "destructive" | "outline";
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant={variant}
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => action())}
    >
      {isPending ? "..." : label}
    </Button>
  );
}
