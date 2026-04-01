"use client";

import * as React from "react";
import {
  shouldSkipImageCrop,
  type ImageCropPreset,
} from "@/lib/image-crop-utils";

type CropSession = {
  objectUrl: string;
  fileBaseName: string;
  resolve: (f: File) => void;
  reject: (e: unknown) => void;
};

/**
 * Opens `ImageCropDialog` when a crop is needed; GIF/SVG upload as-is.
 * Resolve with cropped `File`, or reject with `AbortError` if the user cancels.
 */
export function useImageCropFlow(preset: ImageCropPreset) {
  const [session, setSession] = React.useState<CropSession | null>(null);

  const openCrop = React.useCallback(
    (file: File): Promise<File> => {
      if (shouldSkipImageCrop(file)) {
        return Promise.resolve(file);
      }
      return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const fileBaseName = file.name.replace(/\.[^.]+$/, "") || "upload";
        setSession({ objectUrl, fileBaseName, resolve, reject });
      });
    },
    []
  );

  const confirmCrop = React.useCallback(async (croppedFile: File) => {
    setSession((s) => {
      if (s) {
        URL.revokeObjectURL(s.objectUrl);
        s.resolve(croppedFile);
      }
      return null;
    });
  }, []);

  const cancelCrop = React.useCallback(() => {
    setSession((s) => {
      if (s) {
        URL.revokeObjectURL(s.objectUrl);
        s.reject(new DOMException("Crop cancelled", "AbortError"));
      }
      return null;
    });
  }, []);

  return {
    preset,
    session,
    openCrop,
    confirmCrop,
    cancelCrop,
  };
}
