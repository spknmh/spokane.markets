"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LandingConfig } from "@/lib/landing-config";

interface LandingConfigFormProps {
  initialConfig: LandingConfig;
}

export function LandingConfigForm({ initialConfig }: LandingConfigFormProps) {
  const router = useRouter();
  const [enabled, setEnabled] = React.useState(initialConfig.enabled);
  const [header, setHeader] = React.useState(initialConfig.header);
  const [text, setText] = React.useState(initialConfig.text);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-config/landing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, header, text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6 rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            enabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <div>
          <Label className="text-base font-medium">Landing page enabled</Label>
          <p className="text-sm text-muted-foreground">
            When on, visitors see the landing page instead of the main site. Admins can always access /admin.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="landing-header">Header</Label>
        <Input
          id="landing-header"
          value={header}
          onChange={(e) => setHeader(e.target.value)}
          placeholder="Coming Soon"
          className="font-semibold"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="landing-text">Message</Label>
        <Textarea
          id="landing-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="We're working on something great. Check back soon!"
          rows={4}
          className="resize-y"
        />
        <p className="text-xs text-muted-foreground">Supports multiple lines.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
