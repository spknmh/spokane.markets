import sharp from "sharp";

const LIMITS: Record<"avatar" | "vendor" | "banner" | "event" | "market", number> = {
  avatar: 1024,
  vendor: 2048,
  banner: 2560,
  event: 2560,
  market: 2048,
};

export type UploadImageType = keyof typeof LIMITS;

/**
 * Resize and normalize uploads: strip EXIF orientation via rotate(), cap dimensions,
 * output WebP for raster formats; preserve animated GIF as GIF when possible.
 */
export async function processBufferForUpload(
  buffer: Buffer,
  mimeType: string,
  type: UploadImageType
): Promise<{ buffer: Buffer; extension: string; contentType: string }> {
  const maxDim = LIMITS[type];

  if (mimeType === "image/gif") {
    try {
      const processed = await sharp(buffer, { animated: true, pages: -1 })
        .resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
        .gif()
        .toBuffer();
      return { buffer: processed, extension: "gif", contentType: "image/gif" };
    } catch {
      return { buffer, extension: "gif", contentType: "image/gif" };
    }
  }

  const processed = await sharp(buffer)
    .rotate()
    .resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  return { buffer: processed, extension: "webp", contentType: "image/webp" };
}
