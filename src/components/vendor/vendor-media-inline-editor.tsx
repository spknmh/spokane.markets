"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, Pencil } from "lucide-react";
import { ImageCropDialog } from "@/components/image-upload/image-crop-dialog";
import { useImageCropFlow } from "@/components/image-upload/use-image-crop-flow";
import {
  getCropPresetForBanner,
  getCropPresetForProfileAvatar,
} from "@/lib/image-crop-utils";
import { cn } from "@/lib/utils";

interface VendorMediaInlineEditorProps {
  vendorId: string;
  target: "banner" | "avatar";
  disabled?: boolean;
  className?: string;
}

export function VendorMediaInlineEditor({
  vendorId,
  target,
  disabled = false,
  className,
}: VendorMediaInlineEditorProps) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cropFlow = useImageCropFlow(
    target === "banner" ? getCropPresetForBanner() : getCropPresetForProfileAvatar()
  );
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isBusy = disabled || uploading || cropFlow.session !== null;

  async function uploadAndPersist(file: File) {

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
    setError(null);

    try {
      const formData = new FormData();
      formData.set("file", fileToUpload);

      const uploadRes = await fetch("/api/upload/image?type=vendor", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }

      const { url } = (await uploadRes.json()) as { url: string };
      const persistRes = await fetch(`/api/vendor/media/${vendorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          imageUrl: url,
          focalX: 50,
          focalY: 50,
        }),
      });

      if (!persistRes.ok) {
        const data = await persistRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save image");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image update failed");
    } finally {
      setUploading(false);
    }
  }

  function onFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void uploadAndPersist(file);
    }
    event.target.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFilePicked}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isBusy}
        className={cn(
          "absolute z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-black/55 text-white opacity-100 shadow-sm transition-all duration-200 hover:bg-black/70 sm:h-9 sm:w-9 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
          isBusy && "cursor-wait opacity-100",
          className
        )}
        aria-label={target === "banner" ? "Edit banner image" : "Edit profile image"}
      >
        {target === "banner" ? (
          <Pencil className="h-4 w-4" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </button>

      {error && (
        <p className="absolute bottom-3 left-3 z-20 rounded bg-black/70 px-2 py-1 text-xs text-white">
          {error}
        </p>
      )}

      <ImageCropDialog
        open={cropFlow.session !== null}
        onOpenChange={(open) => {
          if (!open) {
            cropFlow.cancelCrop();
          }
        }}
        imageSrc={cropFlow.session?.objectUrl ?? null}
        preset={cropFlow.preset}
        fileBaseName={cropFlow.session?.fileBaseName}
        onConfirm={cropFlow.confirmCrop}
        busy={uploading}
        title={target === "banner" ? "Crop banner image" : "Crop profile photo"}
      />
    </>
  );
}
