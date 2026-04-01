"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import {
  IMAGE_UPLOAD_AVATAR_HINT,
  imageUploadAvatarButtonClassName,
} from "@/components/image-upload/constants";
import { ImageCropDialog } from "@/components/image-upload/image-crop-dialog";
import { useImageCropFlow } from "@/components/image-upload/use-image-crop-flow";
import { getCropPresetForProfileAvatar } from "@/lib/image-crop-utils";
import { cn } from "@/lib/utils";

interface ProfileImageUploadProps {
  currentImage: string | null;
  fallbackLetter: string;
}

export function ProfileImageUpload({
  currentImage,
  fallbackLetter,
}: ProfileImageUploadProps) {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const cropFlow = useImageCropFlow(getCropPresetForProfileAvatar());
  const interactionBusy = uploading || cropFlow.session !== null;

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setError(null);
    setSuccess(false);

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

      const res = await fetch("/api/upload/image?type=avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }

      const { url } = await res.json();

      const updateRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      });

      if (!updateRes.ok) {
        const data = await updateRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update profile");
      }

      router.refresh();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
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
    if (interactionBusy) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void uploadFile(file);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={interactionBusy}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!interactionBusy) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={cn(
          imageUploadAvatarButtonClassName,
          isDragging && "border-primary bg-primary/10"
        )}
      >
        {currentImage ? (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
            <Image
              src={currentImage}
              alt="Profile"
              fill
              className="object-cover"
              unoptimized={currentImage.startsWith("/uploads/")}
              sizes="128px"
            />
          </div>
        ) : (
          <span className="text-3xl font-bold text-primary">
            {fallbackLetter}
          </span>
        )}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-7 w-7 text-white" />
        </div>
      </button>
      <p className="max-w-[11rem] text-center text-xs text-muted-foreground">
        {IMAGE_UPLOAD_AVATAR_HINT}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />
      {uploading && (
        <span className="text-xs font-medium text-muted-foreground">Uploading…</span>
      )}
      {success && (
        <p className="text-xs font-medium text-green-600 dark:text-green-400">
          Profile updated
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}

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
        title="Crop profile photo"
      />
    </div>
  );
}
