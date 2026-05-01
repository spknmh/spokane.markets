import Image from "next/image";
import { AvatarImage } from "@/components/media";
import { Badge } from "@/components/ui/badge";
import { FavoriteVendorButton } from "@/components/vendor/favorite-vendor-button";
import { ReportButton } from "@/components/report-button";
import { ShareButton } from "@/components/share-button";
import { VendorVerifiedBadge } from "@/components/vendor/vendor-verified-badge";
import { VendorMediaInlineEditor } from "@/components/vendor/vendor-media-inline-editor";

interface VendorProfileHeaderProps {
  vendorId: string;
  slug: string;
  vendorName: string;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED";
  description: string | null;
  imageUrl: string | null;
  imageFocalX: number | null;
  imageFocalY: number | null;
  heroImageUrl: string | null;
  heroImageFocalX: number | null;
  heroImageFocalY: number | null;
  primaryCategory: string | null;
  specialtyTags: string[];
  serviceAreaLabel: string | null;
  favoriteCount: number;
  initialFavorited: boolean;
  initialEmailAlerts: boolean;
  isLoggedIn: boolean;
  canEditMedia: boolean;
  vendorUrl: string;
}

export function VendorProfileHeader({
  vendorId,
  slug,
  vendorName,
  verificationStatus,
  description,
  imageUrl,
  imageFocalX,
  imageFocalY,
  heroImageUrl,
  heroImageFocalX,
  heroImageFocalY,
  primaryCategory,
  specialtyTags,
  serviceAreaLabel,
  favoriteCount,
  initialFavorited,
  initialEmailAlerts,
  isLoggedIn,
  canEditMedia,
  vendorUrl,
}: VendorProfileHeaderProps) {
  const heroSrc = heroImageUrl?.trim() || (imageUrl?.trim() ? imageUrl : null);
  const showHeroFocal = Boolean(heroImageUrl?.trim());
  const shortDescription = description?.trim() ? description.trim() : null;

  return (
    <section className="mb-5 sm:mb-8">
      <div className="group relative overflow-hidden rounded-xl ring-1 ring-border">
        {heroSrc ? (
          heroImageUrl?.trim() ? (
            <div className="relative h-48 w-full sm:h-72">
              <Image
                src={heroSrc}
                alt={`${vendorName} cover image`}
                fill
                className="object-cover"
                style={{
                  objectPosition: `${showHeroFocal ? heroImageFocalX ?? 50 : 50}% ${showHeroFocal ? heroImageFocalY ?? 50 : 50}%`,
                }}
                priority
                unoptimized={heroSrc.startsWith("/uploads/") || heroSrc.startsWith("http")}
              />
            </div>
          ) : (
            <div className="relative h-48 w-full sm:h-72">
              <AvatarImage
                src={heroSrc}
                alt=""
                className="h-full w-full rounded-none"
                focalX={imageFocalX}
                focalY={imageFocalY}
                sizes="100vw"
                pixelSize={1400}
              />
            </div>
          )
        ) : (
          <div className="h-36 bg-gradient-to-br from-primary/15 to-muted sm:h-44" />
        )}

        {canEditMedia && (
          <>
            <div className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-black/30 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100" />
            <VendorMediaInlineEditor
              vendorId={vendorId}
              target="banner"
              className="right-3 top-3"
            />
          </>
        )}
      </div>

      <div className="relative -mt-12 px-3 sm:-mt-20 sm:px-6">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-3 sm:gap-4">
              <div className="group relative shrink-0">
                {imageUrl ? (
                  <AvatarImage
                    src={imageUrl}
                    alt={vendorName}
                    className="h-28 w-28 rounded-2xl border-4 border-background shadow-md sm:h-40 sm:w-40"
                    focalX={imageFocalX}
                    focalY={imageFocalY}
                    sizes="(max-width: 640px) 112px, 160px"
                    pixelSize={160}
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-background bg-primary/20 text-4xl font-bold text-primary shadow-md sm:h-40 sm:w-40">
                    {vendorName.charAt(0)}
                  </div>
                )}
                {canEditMedia && (
                  <>
                    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/25 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100" />
                    <VendorMediaInlineEditor
                      vendorId={vendorId}
                      target="avatar"
                      className="bottom-2 right-2"
                    />
                  </>
                )}
              </div>

              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight sm:text-3xl">{vendorName}</h1>
                  <VendorVerifiedBadge status={verificationStatus} size="md" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {favoriteCount} {favoriteCount === 1 ? "favorite" : "favorites"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FavoriteVendorButton
                slug={slug}
                initialFavorited={initialFavorited}
                initialEmailAlerts={initialEmailAlerts}
                isLoggedIn={isLoggedIn}
                callbackUrl={`/vendors/${slug}`}
                iconOnly
                className="rounded-lg border border-border bg-muted/30 px-1.5"
              />
              <ShareButton
                url={vendorUrl}
                title={vendorName}
                text={description ?? undefined}
                analyticsEventName="vendor_share_click"
                analyticsParams={{ vendor_id: vendorId, surface: "detail_page" }}
              />
              <ReportButton targetType="VENDOR" targetId={vendorId} isLoggedIn={isLoggedIn} />
            </div>
          </div>

          {shortDescription && (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {shortDescription}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {primaryCategory?.trim() && <Badge variant="secondary">{primaryCategory.trim()}</Badge>}
            {specialtyTags.map((specialty) => (
              <Badge key={specialty} variant="outline">
                {specialty}
              </Badge>
            ))}
            {serviceAreaLabel?.trim() && (
              <Badge variant="outline">Serves {serviceAreaLabel.trim()}</Badge>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
