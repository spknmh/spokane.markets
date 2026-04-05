"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MarketingPlaceholderDefinition } from "@/lib/marketing/types";

type TemplateListItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  profile: "SQUARE" | "IG_STORY";
  defaultScale: number;
  active: boolean;
};

type TemplateDetail = TemplateListItem & {
  safeHtmlPlaceholders: string[];
  companionTextKeys: string[];
  placeholderSchemaJson: { placeholders?: MarketingPlaceholderDefinition[] } | null;
  assets: Array<{
    id: string;
    kind: "HTML" | "TEXT" | "IMAGE";
    name: string;
    inlineContent: string | null;
    storageKey: string | null;
  }>;
};

type EntityResult = { id: string; label: string; subtitle?: string };

function normalizePlaceholderSchema(template: TemplateDetail | null): MarketingPlaceholderDefinition[] {
  const raw = template?.placeholderSchemaJson;
  if (!raw || !Array.isArray(raw.placeholders)) return [];
  return raw.placeholders;
}

export function MarketingRenderEditor() {
  const searchParams = useSearchParams();
  const initialTemplateId = searchParams.get("templateId") ?? "";
  const duplicateRenderId = searchParams.get("duplicateRenderId") ?? "";
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDetail | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [scale, setScale] = useState("2");
  const [vendorId, setVendorId] = useState("");
  const [eventId, setEventId] = useState("");
  const [marketId, setMarketId] = useState("");
  const [folderIds, setFolderIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; status: string } | null>(null);
  const [entitySearch, setEntitySearch] = useState({
    vendor: "",
    event: "",
    market: "",
  });
  const [entityResults, setEntityResults] = useState<{
    vendor: EntityResult[];
    event: EntityResult[];
    market: EntityResult[];
  }>({
    vendor: [],
    event: [],
    market: [],
  });

  const placeholderDefs = useMemo(
    () => normalizePlaceholderSchema(selectedTemplate),
    [selectedTemplate]
  );

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/marketing/templates");
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTemplates((data.templates ?? []) as TemplateListItem[]);
      }
    })();
    void (async () => {
      const res = await fetch("/api/admin/marketing/folders");
      const data = await res.json().catch(() => ({}));
      if (res.ok) setFolders(data.folders ?? []);
    })();
    void (async () => {
      const res = await fetch("/api/admin/marketing/tags");
      const data = await res.json().catch(() => ({}));
      if (res.ok) setTags(data.tags ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!selectedTemplateId) {
      setSelectedTemplate(null);
      return;
    }
    void (async () => {
      const res = await fetch(`/api/admin/marketing/templates/${selectedTemplateId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "Failed to load template");
        return;
      }
      const template = data as TemplateDetail;
      setSelectedTemplate(template);
      setScale(String(template.defaultScale ?? 2));
      const defs = normalizePlaceholderSchema(template);
      setVariables((prev) => {
        const nextVars: Record<string, string> = {};
        for (const def of defs) {
          nextVars[def.key] = prev[def.key] ?? "";
        }
        return nextVars;
      });
    })();
  }, [selectedTemplateId]);

  useEffect(() => {
    if (!duplicateRenderId) return;
    void (async () => {
      const res = await fetch(`/api/admin/marketing/renders/${duplicateRenderId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const render = data as {
        templateId: string;
        variablesJson: Record<string, string>;
        scale: number;
        vendorId: string | null;
        eventId: string | null;
        marketId: string | null;
        folders: Array<{ folderId: string }>;
        tags: Array<{ tagId: string }>;
      };
      setSelectedTemplateId(render.templateId);
      setVariables(render.variablesJson ?? {});
      setScale(String(render.scale ?? 2));
      setVendorId(render.vendorId ?? "");
      setEventId(render.eventId ?? "");
      setMarketId(render.marketId ?? "");
      setFolderIds((render.folders ?? []).map((f) => f.folderId));
      setTagIds((render.tags ?? []).map((t) => t.tagId));
    })();
  }, [duplicateRenderId]);

  async function fetchEntity(kind: "vendor" | "event" | "market", q: string) {
    if (!q.trim()) {
      setEntityResults((prev) => ({ ...prev, [kind]: [] }));
      return;
    }
    const res = await fetch(`/api/admin/marketing/entities?kind=${kind}&q=${encodeURIComponent(q)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setEntityResults((prev) => ({ ...prev, [kind]: data.items ?? [] }));
  }

  async function prefillFromEntities() {
    if (!vendorId && !eventId && !marketId) {
      setError("Pick at least one Vendor, Event, or Market before prefilling.");
      return;
    }
    const query = new URLSearchParams({
      mode: "prefill",
      ...(vendorId ? { vendorId } : {}),
      ...(eventId ? { eventId } : {}),
      ...(marketId ? { marketId } : {}),
    });
    const res = await fetch(`/api/admin/marketing/entities?${query.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error?.message ?? "Failed to prefill from entities");
      return;
    }
    setVariables((prev) => ({ ...prev, ...(data.variables ?? {}) }));
  }

  async function uploadForPlaceholder(key: string, file: File) {
    const formData = new FormData();
    formData.set("file", file);
    const res = await fetch("/api/upload/image?type=banner", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setError(data?.error ?? "Image upload failed");
      return;
    }
    setVariables((prev) => ({ ...prev, [key]: data.url as string }));
  }

  async function submitRender() {
    if (!selectedTemplate) {
      setError("Pick a template first");
      return;
    }
    setSaving(true);
    setError(null);
    setResult(null);
    try {
      const payload = {
        templateId: selectedTemplate.id,
        variables,
        entityRefs: {
          vendorId: vendorId || undefined,
          eventId: eventId || undefined,
          marketId: marketId || undefined,
        },
        scale: Number(scale || "2"),
        folderIds,
        tagIds,
      };
      const res = await fetch("/api/admin/marketing/renders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message ?? "Render submit failed");
      setResult(data as { id: string; status: string });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Render submit failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="text-lg font-semibold">1) Select Template</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Template</span>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              <option value="">Select template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.category} - {template.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Scale (supersampling)</span>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3"
              value={scale}
              onChange={(e) => setScale(e.target.value)}
            >
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="3">3x</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="text-lg font-semibold">2) Optional Entity Prefill</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {(["vendor", "event", "market"] as const).map((kind) => (
            <div key={kind} className="space-y-2">
              <p className="text-sm font-medium capitalize">{kind}</p>
              <div className="flex gap-2">
                <Input
                  placeholder={`Search ${kind}s...`}
                  value={entitySearch[kind]}
                  onChange={(e) => setEntitySearch((prev) => ({ ...prev, [kind]: e.target.value }))}
                />
                <Button type="button" variant="outline" onClick={() => void fetchEntity(kind, entitySearch[kind])}>
                  Search
                </Button>
              </div>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3"
                value={kind === "vendor" ? vendorId : kind === "event" ? eventId : marketId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (kind === "vendor") setVendorId(value);
                  if (kind === "event") setEventId(value);
                  if (kind === "market") setMarketId(value);
                }}
              >
                <option value="">No selection</option>
                {entityResults[kind].map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                    {item.subtitle ? ` - ${item.subtitle}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={() => void prefillFromEntities()}>
          Prefill Variables
        </Button>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="text-lg font-semibold">3) Edit Variables</h2>
        {placeholderDefs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No placeholders detected on this template yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {placeholderDefs.map((def) => {
              const type = def.type ?? "text";
              const key = def.key;
              const value = variables[key] ?? "";
              return (
                <div key={key} className="space-y-1">
                  <label className="text-sm font-medium">
                    {def.label}
                    {def.required ? " *" : ""}
                  </label>
                  {type === "textarea" || type === "html" ? (
                    <Textarea
                      value={value}
                      onChange={(e) => setVariables((prev) => ({ ...prev, [key]: e.target.value }))}
                      rows={4}
                    />
                  ) : (
                    <Input
                      value={value}
                      type={type === "url" || type === "image" ? "url" : "text"}
                      onChange={(e) => setVariables((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  )}
                  {type === "image" ? (
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadForPlaceholder(key, file);
                      }}
                    />
                  ) : null}
                  {def.helpText ? (
                    <p className="text-xs text-muted-foreground">{def.helpText}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="text-lg font-semibold">4) Folders and Tags</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Folders</p>
            {folders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No folders yet.</p>
            ) : (
              folders.map((folder) => (
                <label key={folder.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={folderIds.includes(folder.id)}
                    onChange={(e) => {
                      setFolderIds((prev) =>
                        e.target.checked ? [...prev, folder.id] : prev.filter((id) => id !== folder.id)
                      );
                    }}
                  />
                  {folder.name}
                </label>
              ))
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Tags</p>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags yet.</p>
            ) : (
              tags.map((tag) => (
                <label key={tag.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tagIds.includes(tag.id)}
                    onChange={(e) => {
                      setTagIds((prev) =>
                        e.target.checked ? [...prev, tag.id] : prev.filter((id) => id !== tag.id)
                      );
                    }}
                  />
                  {tag.name}
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => void submitRender()} disabled={saving}>
          {saving ? "Queueing..." : "Queue Render"}
        </Button>
        <Button variant="outline" asChild>
          <a href="/admin/marketing/asset-studio/history">Open History</a>
        </Button>
      </div>

      {result ? (
        <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm">
          Render queued: <code>{result.id}</code> ({result.status})
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
