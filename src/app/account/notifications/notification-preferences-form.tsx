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

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <div>
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="rounded border-border"
      />
    </label>
  );
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
    inAppOperationalEnabled: initialPrefs.inAppOperationalEnabled,
    inAppDiscoveryEnabled: initialPrefs.inAppDiscoveryEnabled,
    inAppTrustSafetyEnabled: initialPrefs.inAppTrustSafetyEnabled,
    inAppGrowthEnabled: initialPrefs.inAppGrowthEnabled,
    inAppSystemEnabled: initialPrefs.inAppSystemEnabled,
    weeklyDigestEnabled: initialPrefs.weeklyDigestEnabled,
    eventMatchEnabled: initialPrefs.eventMatchEnabled,
    favoriteVendorEnabled: initialPrefs.favoriteVendorEnabled,
    organizerAlertsEnabled: initialPrefs.organizerAlertsEnabled,
    vendorRequestAlertsEnabled: initialPrefs.vendorRequestAlertsEnabled ?? true,
    reviewAlertsEnabled: initialPrefs.reviewAlertsEnabled ?? true,
    frequency: initialPrefs.frequency,
  });

  function update(field: string, value: boolean | string) {
    setPrefs((p) => ({ ...p, [field]: value }));
  }

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
          <Toggle
            label="Enable email notifications"
            checked={prefs.emailEnabled}
            onChange={(v) => update("emailEnabled", v)}
          />
          <Toggle
            label="Weekly digest"
            checked={prefs.weeklyDigestEnabled}
            onChange={(v) => update("weeklyDigestEnabled", v)}
          />
          <Toggle
            label="New events matching saved filters"
            checked={prefs.eventMatchEnabled}
            onChange={(v) => update("eventMatchEnabled", v)}
          />
          <Toggle
            label="Favorite vendors added to events"
            checked={prefs.favoriteVendorEnabled}
            onChange={(v) => update("favoriteVendorEnabled", v)}
          />
          <Toggle
            label="Organizer alerts"
            description="Event published, rejected, roster activity"
            checked={prefs.organizerAlertsEnabled}
            onChange={(v) => update("organizerAlertsEnabled", v)}
          />
          <Toggle
            label="Vendor roster requests"
            description="When vendors request to join your events"
            checked={prefs.vendorRequestAlertsEnabled}
            onChange={(v) => update("vendorRequestAlertsEnabled", v)}
          />
          <Toggle
            label="Review alerts"
            description="New reviews on your events or vendor profile"
            checked={prefs.reviewAlertsEnabled}
            onChange={(v) => update("reviewAlertsEnabled", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>In-app notifications</CardTitle>
          <CardDescription>
            Control what appears in your notification center.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            label="Enable in-app notifications"
            checked={prefs.inAppEnabled}
            onChange={(v) => update("inAppEnabled", v)}
          />

          <div className={prefs.inAppEnabled ? "" : "pointer-events-none opacity-50"}>
            <p className="mb-3 mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Categories
            </p>
            <div className="space-y-3">
              <Toggle
                label="Operational"
                description="Roster changes, event status, applications"
                checked={prefs.inAppOperationalEnabled}
                onChange={(v) => update("inAppOperationalEnabled", v)}
                disabled={!prefs.inAppEnabled}
              />
              <Toggle
                label="Discovery"
                description="Favorite vendor activity, event matches"
                checked={prefs.inAppDiscoveryEnabled}
                onChange={(v) => update("inAppDiscoveryEnabled", v)}
                disabled={!prefs.inAppEnabled}
              />
              <Toggle
                label="Trust & Safety"
                description="Claims, verifications, moderation"
                checked={prefs.inAppTrustSafetyEnabled}
                onChange={(v) => update("inAppTrustSafetyEnabled", v)}
                disabled={!prefs.inAppEnabled}
              />
              <Toggle
                label="Growth"
                description="Profile tips, performance insights"
                checked={prefs.inAppGrowthEnabled}
                onChange={(v) => update("inAppGrowthEnabled", v)}
                disabled={!prefs.inAppEnabled}
              />
              <Toggle
                label="System"
                description="Account alerts, platform announcements"
                checked={prefs.inAppSystemEnabled}
                onChange={(v) => update("inAppSystemEnabled", v)}
                disabled={!prefs.inAppEnabled}
              />
            </div>
          </div>
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
              onChange={(e) => update("frequency", e.target.value)}
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
