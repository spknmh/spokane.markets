"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { NEIGHBORHOODS } from "@/lib/constants";

interface SubscriberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: { id: string; email: string; areas: string[] };
}

export function SubscriberForm({
  open,
  onOpenChange,
  initialData,
}: SubscriberFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [areas, setAreas] = useState<string[]>(initialData?.areas ?? []);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!initialData;

  useEffect(() => {
    if (open) {
      setEmail(initialData?.email ?? "");
      setAreas(initialData?.areas ?? []);
      setError(null);
    }
  }, [open, initialData?.email, initialData?.areas]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/admin/subscribers/${initialData.id}`
        : "/api/admin/subscribers";
      const method = isEdit ? "PATCH" : "POST";
      const body = isEdit ? { email, areas } : { email, areas };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg =
          json.error?.email?.[0] ?? json.error ?? "Something went wrong";
        setError(msg);
        return;
      }
      onOpenChange(false);
      setEmail("");
      setAreas([]);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function toggleArea(value: string) {
    setAreas((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Subscriber" : "Add Subscriber"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Areas of interest (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {NEIGHBORHOODS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={areas.includes(value)}
                      onChange={() => toggleArea(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty for all areas.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
