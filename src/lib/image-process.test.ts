import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { processBufferForUpload } from "./image-process";

describe("processBufferForUpload", () => {
  it("outputs WebP for PNG uploads", async () => {
    const png = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    })
      .png()
      .toBuffer();

    const out = await processBufferForUpload(png, "image/png", "vendor");
    expect(out.contentType).toBe("image/webp");
    expect(out.extension).toBe("webp");
    expect(out.buffer.length).toBeGreaterThan(0);
  });
});
