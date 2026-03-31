"use client";

import * as React from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { MediaFrame } from "@/components/media";
import { isBannerUnoptimized } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UploadType = "avatar" | "vendor" | "banner" | "event" | "market";

interface ImageUploadWithUrlProps {
  value: string;
  onChange: (url: string) => void;
  uploadType: UploadType;
  disabled?: boolean;
  label?: string;
  /** Preview aspect ratio: "square" (1:1) or "banner" (16:9) */
  aspectRatio?: "square" | "banner";
  /** Hide manual URL input and keep upload-only flow. */
  hideUrlInput?: boolean;
}

export function ImageUploadWithUrl({
  value,
  onChange,
  uploadType,
  disabled,
  label = "Image",
  aspectRatio = "square",
  hideUrlInput = false,
}: ImageUploadWithUrlProps) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const res = await fetch(`/api/upload/image?type=${uploadType}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }

      const { url } = await res.json();
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className={`group relative flex items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary hover:bg-muted/50 disabled:opacity-50 ${
            aspectRatio === "banner" ? "w-full max-w-xs" : "h-24 w-24 shrink-0"
          }`}
        >
          {value ? (
            aspectRatio === "banner" ? (
              <span className="pointer-events-none block w-full [&>div]:rounded-lg">
                <MediaFrame
                  src={value}
                  alt="Preview"
                  aspect="video"
                  sizes="320px"
                  className="w-full"
                />
              </span>
            ) : (
              <div className="pointer-events-none relative h-24 w-24">
                <Image
                  src={value}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized={isBannerUnoptimized(value)}
                  sizes="96px"
                />
              </div>
            )
          ) : (
            <Camera className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </button>
        <div className="flex-1 space-y-2 min-w-0">
          <p className="text-sm text-muted-foreground">
            {hideUrlInput
              ? value
                ? "Change image"
                : "Upload image"
              : `${value ? "Change image" : "Upload image"} or paste URL below`}
          </p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP or GIF. Max 5MB. Large files are resized automatically on upload.
          </p>
          {uploading && (
            <p className="text-xs text-muted-foreground">Uploading…</p>
          )}
          {!hideUrlInput && (
            <Input
              type="text"
              placeholder="https://... or leave empty if uploading"
              value={value ?? ""}
              onChange={(e) => {
                setError(null);
                onChange(e.target.value);
              }}
              disabled={disabled}
              className="mt-1"
            />
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
