"use client";

import * as React from "react";
import Image from "next/image";
import { Camera } from "lucide-react";

interface VendorImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function VendorImageUpload({
  value,
  onChange,
  disabled,
}: VendorImageUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const res = await fetch("/api/upload/image?type=vendor", {
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
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary hover:bg-muted/50 disabled:opacity-50"
        >
          {value ? (
            <Image
              src={value}
              alt="Vendor"
              width={96}
              height={96}
              className="h-full w-full object-cover"
              unoptimized={value.startsWith("/uploads/")}
            />
          ) : (
            <Camera className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </button>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {value ? "Change image" : "Upload image"}
          </p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP or GIF. Max 5MB.
          </p>
          {uploading && (
            <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
