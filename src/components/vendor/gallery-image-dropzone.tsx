"use client";

import * as React from "react";
import Image from "next/image";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  IMAGE_UPLOAD_DROPZONE_HINT,
  imageUploadGalleryTileMinClassName,
} from "@/components/image-upload/constants";
import { ImageCropDialog } from "@/components/image-upload/image-crop-dialog";
import { useImageCropFlow } from "@/components/image-upload/use-image-crop-flow";
import { getCropPresetForSquareLogo } from "@/lib/image-crop-utils";
import { cn, isBannerUnoptimized } from "@/lib/utils";

interface GalleryImageDropzoneProps {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

const ACCEPTED_FILE_TYPES = "image/jpeg,image/png,image/webp,image/gif";

export function GalleryImageDropzone({
  value,
  onChange,
  disabled = false,
  maxImages = 6,
}: GalleryImageDropzoneProps) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const cropFlow = useImageCropFlow(getCropPresetForSquareLogo());
  const interactionBusy = uploading || cropFlow.session !== null;

  const canAddMore = value.length < maxImages;

  function removeAt(index: number) {
    setError(null);
    onChange(value.filter((_, i) => i !== index));
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;

    const remaining = Math.max(0, maxImages - value.length);
    if (remaining <= 0) {
      setError(`You can upload up to ${maxImages} images.`);
      return;
    }

    const filesToUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      setError(`Only the first ${remaining} image(s) were added (max ${maxImages}).`);
    } else {
      setError(null);
    }

    setUploading(true);
    const uploaded: string[] = [];

    try {
      for (const file of filesToUpload) {
        let fileToUpload = file;
        try {
          fileToUpload = await cropFlow.openCrop(file);
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") {
            continue;
          }
          throw e;
        }

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
        const data = await res.json();
        if (typeof data.url === "string" && data.url) {
          uploaded.push(data.url);
        }
      }

      if (uploaded.length > 0) {
        onChange([...value, ...uploaded].slice(0, maxImages));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || interactionBusy || !canAddMore) return;
    if (e.dataTransfer.files?.length) {
      void uploadFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Gallery Images</p>
        <p className="text-xs text-muted-foreground">
          {value.length}/{maxImages}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {value.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-lg border border-border",
              imageUploadGalleryTileMinClassName
            )}
          >
            <Image
              src={url}
              alt={`Gallery image ${index + 1}`}
              fill
              className="object-cover"
              unoptimized={isBannerUnoptimized(url)}
              sizes="(max-width: 640px) 50vw, 180px"
            />
            <button
              type="button"
              aria-label={`Remove image ${index + 1}`}
              onClick={() => removeAt(index)}
              disabled={disabled || interactionBusy}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/75 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled && !interactionBusy) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            disabled={disabled || interactionBusy}
            className={cn(
              "flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 text-center transition",
              imageUploadGalleryTileMinClassName,
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border bg-muted/20 hover:border-primary/60 hover:bg-muted/40",
              "disabled:opacity-50"
            )}
          >
            {isDragging ? (
              <Upload className="h-6 w-6 text-primary" />
            ) : (
              <Camera className="h-6 w-6 text-muted-foreground" />
            )}
            <span className="mt-2 px-1 text-center text-xs leading-snug text-muted-foreground">
              {IMAGE_UPLOAD_DROPZONE_HINT}
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Up to {maxImages} images. JPEG, PNG, WebP, or GIF.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || interactionBusy || !canAddMore}
        >
          {uploading ? "Uploading..." : "Upload image"}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            void uploadFiles(e.target.files);
          }
          e.target.value = "";
        }}
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
        title="Crop gallery image"
      />
    </div>
  );
}
