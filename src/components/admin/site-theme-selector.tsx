"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SiteTheme } from "@/lib/site-theme";

const THEME_OPTIONS: { value: SiteTheme; label: string }[] = [
  { value: "cedar", label: "Cedar & Harvest (current default)" },
  { value: "evergreen", label: "Evergreen Mist" },
  { value: "paper", label: "Paper Forest" },
  { value: "clay", label: "Soft Clay" },
];

interface SiteThemeSelectorProps {
  currentTheme: SiteTheme;
}

export function SiteThemeSelector({ currentTheme }: SiteThemeSelectorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(theme: SiteTheme) {
    if (theme === currentTheme) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-config/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
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
    <Card>
      <CardHeader>
        <CardTitle>Color palette</CardTitle>
        <CardDescription>
          Choose the main site color palette. Changes apply to the public-facing site (homepage, events, markets, etc.).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {THEME_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                currentTheme === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              } ${saving ? "pointer-events-none opacity-70" : ""}`}
            >
              <input
                type="radio"
                name="site-theme"
                value={opt.value}
                checked={currentTheme === opt.value}
                onChange={() => handleChange(opt.value)}
                disabled={saving}
                className="h-4 w-4 border-border text-primary focus:ring-primary"
              />
              <span className="font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
        {saving && <p className="text-sm text-muted-foreground">Saving…</p>}
      </CardContent>
    </Card>
  );
}
