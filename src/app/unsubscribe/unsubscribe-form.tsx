"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SOURCES = [
  { value: "digest", label: "Weekly digest" },
  { value: "filters", label: "Filter alerts" },
  { value: "favorites", label: "Vendor favorite alerts" },
] as const;

type Source = (typeof SOURCES)[number]["value"];

export function UnsubscribeForm({
  defaultEmail = "",
  defaultSource = "digest",
}: {
  defaultEmail?: string;
  defaultSource?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [source, setSource] = useState<Source>(
    SOURCES.some((s) => s.value === defaultSource) ? (defaultSource as Source) : "digest"
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const res = await fetch(
      `/api/subscribe?email=${encodeURIComponent(email)}&source=${encodeURIComponent(source)}`,
      { method: "DELETE" }
    );

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus("error");
      setErrorMessage(typeof json.error === "string" ? json.error : "Failed to unsubscribe.");
      return;
    }

    setStatus("success");
    router.refresh();
  }

  if (status === "success") {
    return (
      <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <p className="font-medium text-foreground">You have been unsubscribed.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          You will no longer receive these emails. You can resubscribe anytime from the homepage.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Unsubscribe from</Label>
        <div className="space-y-2">
          {SOURCES.map((s) => (
            <label key={s.value} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="source"
                value={s.value}
                checked={source === s.value}
                onChange={() => setSource(s.value as Source)}
              />
              <span className="text-sm">{s.label}</span>
            </label>
          ))}
        </div>
      </div>
      {errorMessage && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Unsubscribing…" : "Unsubscribe"}
      </Button>
    </form>
  );
}
