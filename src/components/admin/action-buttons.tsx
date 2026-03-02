"use client";

import { useState } from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeleteButton({
  action,
  label = "Delete",
  title = "Delete",
  description = "Are you sure? This action cannot be undone.",
}: {
  action: () => Promise<void>;
  label?: string;
  title?: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await action();
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() => setOpen(true)}
      >
        {isPending ? "Deleting..." : label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
