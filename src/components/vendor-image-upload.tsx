"use client";

import * as React from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import {
  IMAGE_UPLOAD_DROPZONE_HINT,
  imageUploadSquareButtonClassName,
} from "@/components/image-upload/constants";
import { ImageCropDialog } from "@/components/image-upload/image-crop-dialog";
import { useImageCropFlow } from "@/components/image-upload/use-image-crop-flow";
import { getCropPresetForSquareLogo } from "@/lib/image-crop-utils";
import { cn } from "@/lib/utils";

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
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const cropFlow = useImageCropFlow(getCropPresetForSquareLogo());
  const interactionBusy = uploading || cropFlow.session !== null;

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setError(null);

    let fileToUpload = file;
    try {
      fileToUpload = await cropFlow.openCrop(file);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }
      throw e;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.set("file", fileToUpload);

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
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void uploadFile(file);
    }
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || interactionBusy) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void uploadFile(file);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || interactionBusy}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled && !interactionBusy) setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={cn(
            imageUploadSquareButtonClassName,
            isDragging && "border-primary bg-primary/10"
          )}
        >
          {value ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
              <Image
                src={value}
                alt="Vendor"
                fill
                className="object-cover"
                unoptimized={value.startsWith("/uploads/")}
                sizes="160px"
              />
            </div>
          ) : (
            <div className="pointer-events-none flex max-w-[12rem] flex-col items-center justify-center gap-2 px-2 py-2 text-center">
              <Camera className="h-10 w-10 shrink-0 text-muted-foreground" />
              <span className="text-xs leading-snug text-muted-foreground">
                {IMAGE_UPLOAD_DROPZONE_HINT}
              </span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-7 w-7 text-white" />
          </div>
        </button>
        <div className="w-full max-w-2xl space-y-1">
          <p className="text-sm font-medium text-foreground">
            {value ? "Change image" : "Upload image"}
          </p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP or GIF. Max 5MB.
          </p>
          {uploading && (
            <p className="text-xs text-muted-foreground">Uploading…</p>
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
      {error && <p className="text-sm text-destructive">{error}</p>}

      <ImageCropDialog
        open={cropFlow.session !== null}
        onOpenChange={(o) => {
          if (!o) cropFlow.cancelCrop();
        }}
        imageSrc={cropFlow.session?.objectUrl ?? null}
        preset={cropFlow.preset}
        fileBaseName={cropFlow.session?.fileBaseName}
        onConfirm={cropFlow.confirmCrop}
        busy={uploading}
        title="Crop image"
      />
    </div>
  );
}
