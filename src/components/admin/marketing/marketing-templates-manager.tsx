"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type TemplateItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  profile: "SQUARE" | "IG_STORY";
  active: boolean;
  defaultScale: number;
  version: number;
  friendlyFilenameStem: string | null;
  assets: Array<{
    id: string;
    kind: "HTML" | "TEXT" | "IMAGE";
    name: string;
    storageKey: string | null;
    updatedAt: string;
  }>;
  _count: { renders: number };
};

const DEFAULT_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { margin: 0; width: 1080px; height: 1080px; font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; }
      .card { padding: 48px; text-align: center; }
      h1 { font-size: 82px; margin: 0 0 20px; }
      p { font-size: 36px; margin: 0; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>{{VENDOR_NAME}}</h1>
      <p>{{LISTING_URL}}</p>
    </div>
  </body>
</html>`;

export function MarketingTemplatesManager() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    slug: "",
    name: "",
    category: "Vendor spotlight",
    profile: "SQUARE",
    defaultScale: "2",
    friendlyFilenameStem: "",
    htmlSource: DEFAULT_HTML,
    captionSource: "",
  });

  async function loadTemplates() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/marketing/templates");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to load templates");
      setTemplates(data.templates ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTemplates();
  }, []);

  async function createTemplate() {
    setError(null);
    try {
      const payload = {
        slug: formState.slug.trim(),
        name: formState.name.trim(),
        category: formState.category.trim(),
        profile: formState.profile,
        defaultScale: Number(formState.defaultScale || "2"),
        friendlyFilenameStem: formState.friendlyFilenameStem.trim(),
        safeHtmlPlaceholders: [],
        companionTextKeys: formState.captionSource.trim() ? ["caption"] : [],
        placeholderSchemaJson: [],
        assets: [
          {
            kind: "HTML",
            name: "main.html",
            inlineContent: formState.htmlSource,
            storageKey: "",
            mimeType: "text/html",
          },
          ...(formState.captionSource.trim()
            ? [
                {
                  kind: "TEXT",
                  name: "caption.txt",
                  inlineContent: formState.captionSource,
                  storageKey: "",
                  mimeType: "text/plain",
                },
              ]
            : []),
        ],
      };
      const res = await fetch("/api/admin/marketing/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message ?? "Template create failed");
      await loadTemplates();
      setFormState((prev) => ({
        ...prev,
        slug: "",
        name: "",
        friendlyFilenameStem: "",
        captionSource: "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Template create failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Create Template</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="slug (vendor-spotlight-theme-01)"
            value={formState.slug}
            onChange={(e) => setFormState((prev) => ({ ...prev, slug: e.target.value }))}
          />
          <Input
            placeholder="Template name"
            value={formState.name}
            onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            placeholder="Category (Vendor spotlight, IG story...)"
            value={formState.category}
            onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
          />
          <Input
            placeholder="Friendly filename stem"
            value={formState.friendlyFilenameStem}
            onChange={(e) => setFormState((prev) => ({ ...prev, friendlyFilenameStem: e.target.value }))}
          />
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Profile</span>
            <select
              value={formState.profile}
              onChange={(e) => setFormState((prev) => ({ ...prev, profile: e.target.value as "SQUARE" | "IG_STORY" }))}
              className="h-10 w-full rounded-md border border-input bg-background px-3"
            >
              <option value="SQUARE">Square</option>
              <option value="IG_STORY">IG Story (9:16)</option>
            </select>
          </label>
          <Input
            placeholder="Default scale (1-3)"
            value={formState.defaultScale}
            onChange={(e) => setFormState((prev) => ({ ...prev, defaultScale: e.target.value }))}
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">HTML template</p>
            <Textarea
              rows={16}
              value={formState.htmlSource}
              onChange={(e) => setFormState((prev) => ({ ...prev, htmlSource: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Companion caption text (optional)</p>
            <Textarea
              rows={16}
              value={formState.captionSource}
              onChange={(e) => setFormState((prev) => ({ ...prev, captionSource: e.target.value }))}
              placeholder="Use {{PLACEHOLDER}} tokens here too."
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={createTemplate}>Create Template</Button>
          <Button variant="outline" onClick={loadTemplates} disabled={loading}>
            Refresh
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Template</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Profile</th>
              <th className="px-4 py-3 text-left font-medium">Assets</th>
              <th className="px-4 py-3 text-left font-medium">Version</th>
              <th className="px-4 py-3 text-left font-medium">Renders</th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {loading ? "Loading templates..." : "No templates yet."}
                </td>
              </tr>
            ) : (
              templates.map((template) => (
                <tr key={template.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.slug}</p>
                  </td>
                  <td className="px-4 py-3">{template.category}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{template.profile}</Badge>
                  </td>
                  <td className="px-4 py-3">{template.assets.length}</td>
                  <td className="px-4 py-3">{template.version}</td>
                  <td className="px-4 py-3">{template._count.renders}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
