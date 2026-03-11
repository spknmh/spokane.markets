"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SiteAnnouncement } from "@/lib/site-announcement";

interface SiteAnnouncementFormProps {
  initialAnnouncement: SiteAnnouncement;
}

export function SiteAnnouncementForm({
  initialAnnouncement,
}: SiteAnnouncementFormProps) {
  const router = useRouter();
  const [enabled, setEnabled] = React.useState(initialAnnouncement.enabled);
  const [text, setText] = React.useState(initialAnnouncement.text);
  const [linkLabel, setLinkLabel] = React.useState(
    initialAnnouncement.linkLabel ?? ""
  );
  const [linkUrl, setLinkUrl] = React.useState(
    initialAnnouncement.linkUrl ?? ""
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch("/api/admin/site-config/announcement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          text,
          linkLabel,
          linkUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }

      router.refresh();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl space-y-6 rounded-lg border border-border bg-card p-6"
    >
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
          <Label className="text-base font-medium">Announcement bar enabled</Label>
          <p className="text-sm text-muted-foreground">
            Show a slim site-wide message below the header with an optional CTA link.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="announcement-text">Message</Label>
        <Textarea
          id="announcement-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Applications are open for Spokane vendors and market organizers."
          rows={3}
          className="resize-y"
        />
        <p className="text-xs text-muted-foreground">
          Keep this brief so it stays noticeable without taking over the page.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="announcement-link-label">CTA label</Label>
          <Input
            id="announcement-link-label"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="Apply now"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="announcement-link-url">CTA URL</Label>
          <Input
            id="announcement-link-url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/apply/vendor"
          />
          <p className="text-xs text-muted-foreground">
            Use a relative path or a full `https://` URL.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm font-medium text-primary">Saved</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
