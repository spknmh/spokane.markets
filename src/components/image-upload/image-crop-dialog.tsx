"use client";

import * as React from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCroppedImageBlob, type ImageCropPreset } from "@/lib/image-crop-utils";

export type ImageCropDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Object URL or remote URL for <img src> */
  imageSrc: string | null;
  preset: ImageCropPreset;
  title?: string;
  /** Base name for the output file (no extension) */
  fileBaseName?: string;
  onConfirm: (file: File) => void | Promise<void>;
  busy?: boolean;
};

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  preset,
  title = "Crop image",
  fileBaseName = "image",
  onConfirm,
  busy = false,
}: ImageCropDialogProps) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const croppedPixelsRef = React.useRef<Area | null>(null);
  const [cropPixelsReady, setCropPixelsReady] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);

  React.useEffect(() => {
    if (open && imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      croppedPixelsRef.current = null;
      setCropPixelsReady(false);
    }
  }, [open, imageSrc]);

  const syncPixels = React.useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      croppedPixelsRef.current = croppedAreaPixels;
      setCropPixelsReady(true);
    },
    []
  );

  async function handleSave() {
    if (!imageSrc || !croppedPixelsRef.current) return;
    setProcessing(true);
    try {
      const { blob, fileName } = await getCroppedImageBlob(
        imageSrc,
        croppedPixelsRef.current,
        { fileBaseName }
      );
      const file = new File([blob], fileName, { type: blob.type });
      await onConfirm(file);
    } finally {
      setProcessing(false);
    }
  }

  const disabled = busy || processing || !imageSrc || !cropPixelsReady;

  if (!open || !imageSrc) {
    return null;
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0" showClose={!processing && !busy}>
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Drag to reposition. Use the slider or pinch to zoom.
            {preset.cropShape === "round"
              ? " The preview is circular so you can frame your face like a profile photo."
              : preset.aspect >= 1.5
                ? " Use a wide frame for hero and banner images."
                : " Aim for a balanced square for thumbnails and logos."}
          </p>
        </DialogHeader>

        <div className="relative h-[min(55vh,22rem)] w-full bg-muted">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={preset.aspect}
            cropShape={preset.cropShape}
            showGrid={preset.cropShape === "rect"}
            objectFit="contain"
            onCropChange={setCrop}
            onCropComplete={syncPixels}
            onCropAreaChange={syncPixels}
            onZoomChange={setZoom}
          />
        </div>

        <div className="space-y-2 px-6 py-3">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="image-crop-zoom">
            Zoom
          </label>
          <input
            id="image-crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.02}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            disabled={disabled}
            className={cn(
              "h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary",
              disabled && "opacity-50"
            )}
          />
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing || busy}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={disabled}>
            {processing || busy ? "Working…" : "Use cropped image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
