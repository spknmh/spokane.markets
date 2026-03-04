"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { MaintenanceMode } from "@prisma/client";

interface MaintenanceLink {
  label: string;
  url: string;
}

interface MaintenanceFormProps {
  initialState: {
    mode: MaintenanceMode;
    messageTitle: string;
    messageBody: string | null;
    links: MaintenanceLink[];
    eta: Date | null;
  };
}

const MODE_LABELS: Record<MaintenanceMode, string> = {
  OFF: "Off (normal site)",
  MAINTENANCE_ADMIN_ONLY: "Maintenance — Admins only",
  MAINTENANCE_PRIVILEGED: "Maintenance — Admins + Vendors + Organizers",
};

export function MaintenanceForm({ initialState }: MaintenanceFormProps) {
  const router = useRouter();
  const [mode, setMode] = React.useState<MaintenanceMode>(initialState.mode);
  const [messageTitle, setMessageTitle] = React.useState(
    initialState.messageTitle
  );
  const [messageBody, setMessageBody] = React.useState(
    initialState.messageBody ?? ""
  );
  const [links, setLinks] = React.useState<MaintenanceLink[]>(
    initialState.links?.length ? [...initialState.links] : []
  );
  const [eta, setEta] = React.useState(
    initialState.eta
      ? new Date(initialState.eta).toISOString().slice(0, 16)
      : ""
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
      const res = await fetch("/api/admin/site-config/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          messageTitle,
          messageBody: messageBody.trim() || null,
          links: links.filter((l) => l.label.trim() && l.url.trim()),
          eta: eta || null,
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
      <div className="space-y-2">
        <Label htmlFor="maintenance-mode">Mode</Label>
        <Select
          id="maintenance-mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as MaintenanceMode)}
        >
          {(Object.keys(MODE_LABELS) as MaintenanceMode[]).map((m) => (
            <option key={m} value={m}>
              {MODE_LABELS[m]}
            </option>
          ))}
        </Select>
        <p className="text-sm text-muted-foreground">
          {mode === "OFF" && "Site is fully accessible."}
          {mode === "MAINTENANCE_ADMIN_ONLY" &&
            "Only admins can access. Everyone else sees the maintenance page."}
          {mode === "MAINTENANCE_PRIVILEGED" &&
            "Admins, vendors, and organizers can access. Others see the maintenance page."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maintenance-title">Message title</Label>
        <Input
          id="maintenance-title"
          value={messageTitle}
          onChange={(e) => setMessageTitle(e.target.value)}
          placeholder="We'll be right back"
          className="font-semibold"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maintenance-body">Message body</Label>
        <Textarea
          id="maintenance-body"
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
          placeholder="We're working on something great. Check back soon! Use Markdown: links [text](url), lists, blockquotes (>) for notes."
          rows={5}
          className="resize-y"
        />
        <p className="text-xs text-muted-foreground">
          Markdown supported: links, lists, bold. Use <code className="rounded bg-muted px-1">&gt; **Note:**</code> for info callouts.
        </p>
      </div>

      <div className="space-y-2">
        <Label>CTA links (optional)</Label>
        <p className="text-xs text-muted-foreground">
          Prominent buttons/links shown below the message.
        </p>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Label"
                value={link.label}
                onChange={(e) => {
                  const next = [...links];
                  next[i] = { ...next[i], label: e.target.value };
                  setLinks(next);
                }}
              />
              <Input
                placeholder="URL"
                value={link.url}
                onChange={(e) => {
                  const next = [...links];
                  next[i] = { ...next[i], url: e.target.value };
                  setLinks(next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setLinks(links.filter((_, j) => j !== i))}
                aria-label="Remove link"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLinks([...links, { label: "", url: "" }])}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add link
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maintenance-eta">Estimated return (optional)</Label>
        <Input
          id="maintenance-eta"
          type="datetime-local"
          value={eta}
          onChange={(e) => setEta(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm font-medium text-going">Saved</p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
