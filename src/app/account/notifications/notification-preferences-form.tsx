"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SITE_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { NotificationPreference } from "@prisma/client";

interface NotificationPreferencesFormProps {
  initialPrefs: NotificationPreference;
}

export function NotificationPreferencesForm({
  initialPrefs,
}: NotificationPreferencesFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prefs, setPrefs] = useState({
    emailEnabled: initialPrefs.emailEnabled,
    inAppEnabled: initialPrefs.inAppEnabled,
    weeklyDigestEnabled: initialPrefs.weeklyDigestEnabled,
    eventMatchEnabled: initialPrefs.eventMatchEnabled,
    favoriteVendorEnabled: initialPrefs.favoriteVendorEnabled,
    organizerAlertsEnabled: initialPrefs.organizerAlertsEnabled,
    vendorRequestAlertsEnabled: initialPrefs.vendorRequestAlertsEnabled ?? true,
    reviewAlertsEnabled: initialPrefs.reviewAlertsEnabled ?? true,
    frequency: initialPrefs.frequency,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const res = await fetch("/api/account/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message ?? "Failed to save");
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
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          Preferences saved.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Email notifications</CardTitle>
          <CardDescription>
            Control which emails you receive from {SITE_NAME}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Enable email notifications</span>
            <input
              type="checkbox"
              checked={prefs.emailEnabled}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, emailEnabled: e.target.checked }))
              }
              className="rounded border-border"
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Weekly digest</span>
            <input
              type="checkbox"
              checked={prefs.weeklyDigestEnabled}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, weeklyDigestEnabled: e.target.checked }))
              }
              className="rounded border-border"
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">
              New events matching saved filters
            </span>
            <input
              type="checkbox"
              checked={prefs.eventMatchEnabled}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, eventMatchEnabled: e.target.checked }))
              }
              className="rounded border-border"
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">
              Favorite vendors added to events
            </span>
            <input
              type="checkbox"
              checked={prefs.favoriteVendorEnabled}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  favoriteVendorEnabled: e.target.checked,
                }))
              }
              className="rounded border-border"
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">
              Organizer alerts (event published/rejected)
            </span>
            <input
              type="checkbox"
              checked={prefs.organizerAlertsEnabled}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  organizerAlertsEnabled: e.target.checked,
                }))
              }
              className="rounded border-border"
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">
              Vendor roster requests (when vendors request to join your events)
            </span>
            <input
              type="checkbox"
              checked={prefs.vendorRequestAlertsEnabled}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  vendorRequestAlertsEnabled: e.target.checked,
                }))
              }
              className="rounded border-border"
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">
              New reviews on your events or vendor profile
            </span>
            <input
              type="checkbox"
              checked={prefs.reviewAlertsEnabled}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  reviewAlertsEnabled: e.target.checked,
                }))
              }
              className="rounded border-border"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>In-app notifications</CardTitle>
          <CardDescription>
            Show notifications in the site notification center.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Enable in-app notifications</span>
            <input
              type="checkbox"
              checked={prefs.inAppEnabled}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, inAppEnabled: e.target.checked }))
              }
              className="rounded border-border"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frequency</CardTitle>
          <CardDescription>
            How often to receive non-immediate notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Delivery frequency</Label>
            <select
              value={prefs.frequency}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  frequency: e.target.value as "immediate" | "daily" | "weekly",
                }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="immediate">Immediate</option>
              <option value="daily">Daily summary</option>
              <option value="weekly">Weekly summary</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}
