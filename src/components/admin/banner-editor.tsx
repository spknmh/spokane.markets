"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link2, RotateCcw } from "lucide-react";
import { isBannerUnoptimized } from "@/lib/utils";

interface BannerEditorProps {
  bannerKey: string;
  label: string;
  currentUrl: string;
  isCustom?: boolean;
}

export function BannerEditor({ bannerKey, label, currentUrl, isCustom }: BannerEditorProps) {
  const router = useRouter();
  const [urlInput, setUrlInput] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const res = await fetch("/api/upload/image?type=banner", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }

      const { url } = await res.json();
      await saveBanner(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSaveUrl() {
    const url = urlInput.trim();
    if (!url) return;

    setError(null);
    setSaving(true);
    try {
      await saveBanner(url);
      setUrlInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

    async function handleReset() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/site-config?key=${encodeURIComponent(bannerKey)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to reset");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset");
    } finally {
      setSaving(false);
    }
  }

  async function saveBanner(url: string) {
    const res = await fetch("/api/admin/site-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: bannerKey, value: url }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to save");
    }

    router.refresh();
  }

  const useUnoptimized = isBannerUnoptimized(currentUrl);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative aspect-[2/1] overflow-hidden rounded-md bg-muted">
        <Image
          src={currentUrl}
          alt={label}
          fill
          className="object-cover"
          unoptimized={useUnoptimized}
          sizes="(max-width: 640px) 100vw, 50vw"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-1" />
          Upload
        </Button>
        {isCustom && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={saving}
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleUpload}
        />
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Or paste image URL"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSaveUrl()}
          className="h-9"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!urlInput.trim() || saving}
          onClick={handleSaveUrl}
        >
          <Link2 className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
