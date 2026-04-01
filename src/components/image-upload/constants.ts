import { cn } from "@/lib/utils";

/**
 * Shared dimensions for image upload UIs across account, vendor, admin, and organizer flows.
 * Square previews use 160px (size-40) for clearer previews and comfortable tap targets.
 *
 * Consumers (keep in sync when changing sizes):
 * - `ProfileImageUpload`, `DashboardHeaderCard` (128px avatar), `VendorImageUpload`
 * - `ImageUploadWithUrl` — admin: vendor/market/event/promotion; organizer: market/event; vendor profile
 * - `GalleryImageDropzone`, `ReviewForm`, `BannerEditor` (admin site settings, upload-only)
 */

/** Square logo / market / event / vendor thumbnail (1:1, dashed dropzone). */
export const imageUploadSquareButtonClassName = cn(
  "group relative flex aspect-square w-40 max-w-full min-h-[10rem] min-w-[10rem] shrink-0",
  "items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30",
  "transition-colors hover:border-primary hover:bg-muted/50 disabled:opacity-50"
);

/** 16:9 banner or hero image upload preview. */
export const imageUploadBannerButtonClassName = cn(
  "group relative flex w-full max-w-2xl aspect-video min-h-[11rem] shrink-0",
  "items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30",
  "transition-colors hover:border-primary hover:bg-muted/50 disabled:opacity-50"
);

/** User profile photo (circular, account menu / dashboard). */
export const imageUploadAvatarButtonClassName = cn(
  "group relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border",
  "transition-colors hover:border-primary disabled:opacity-50"
);

/** Shorter hint for compact circular avatar control (profile form). */
export const IMAGE_UPLOAD_AVATAR_HINT = "Click or drop a photo to upload";

/** Read-only avatar in dashboard headers — same 128px as `ProfileImageUpload`. */
export const imageUploadAvatarReadOnlyImageClassName =
  "h-32 w-32 shrink-0 rounded-full object-cover";

/** Placeholder letter when user has no photo (dashboard headers). */
export const imageUploadAvatarReadOnlyFallbackClassName = cn(
  "flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-primary/20",
  "text-3xl font-bold text-primary"
);

/** Filled review photo thumbnail (solid border). */
export const imageUploadReviewPreviewClassName =
  "relative aspect-square min-h-[7rem] min-w-[7rem] w-28 max-w-[40vw] overflow-hidden rounded-md border border-border";

/** “Add photo” control (dashed). */
export const imageUploadReviewAddButtonClassName = cn(
  "flex aspect-square min-h-[7rem] min-w-[7rem] w-28 max-w-[40vw] flex-col items-center justify-center",
  "rounded-md border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
);

/** Gallery grid: minimum cell size so empty slot stays tappable on narrow screens. */
export const imageUploadGalleryTileMinClassName = "min-h-[7.5rem]";

/** Standard hint inside image drop zones (matches click + drag behavior). */
export const IMAGE_UPLOAD_DROPZONE_HINT =
  "Drag and drop an image here, or click to choose a file";
