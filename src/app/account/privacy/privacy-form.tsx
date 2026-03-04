"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PrivacyFormProps {
  contactVisible: boolean;
  socialLinksVisible: boolean;
}

export function PrivacyForm({
  contactVisible: initialContactVisible,
  socialLinksVisible: initialSocialLinksVisible,
}: PrivacyFormProps) {
  const router = useRouter();
  const [contactVisible, setContactVisible] = useState(initialContactVisible);
  const [socialLinksVisible, setSocialLinksVisible] = useState(initialSocialLinksVisible);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const res = await fetch("/api/account/vendor-privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactVisible, socialLinksVisible }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          Preferences saved.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
          <CardDescription>
            Choose what information is visible on your public vendor profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Show contact email and phone</span>
            <input
              type="checkbox"
              checked={contactVisible}
              onChange={(e) => setContactVisible(e.target.checked)}
              className="rounded border-border"
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Show website and social links</span>
            <input
              type="checkbox"
              checked={socialLinksVisible}
              onChange={(e) => setSocialLinksVisible(e.target.checked)}
              className="rounded border-border"
            />
          </label>
        </CardContent>
      </Card>

      <Button type="submit" className="mt-4" disabled={saving}>
        {saving ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}
