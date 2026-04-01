"use client";

import * as React from "react";
import {
  trackApiError,
  trackEvent,
  trackMilestoneEvent,
} from "@/lib/analytics";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  vendorProfileSchema,
  type VendorProfileInput,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ImageUploadWithUrl } from "@/components/image-upload-with-url";
import { GalleryImageDropzone } from "@/components/vendor/gallery-image-dropzone";
import { FormErrorBanner } from "@/components/ui/form-error-banner";

interface VendorProfileFormProps {
  initialData?: VendorProfileInput & { id?: string };
}

export function VendorProfileForm({ initialData }: VendorProfileFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const isEditing = !!initialData?.id;
  const profileUrlPrefix = "https://spokane.markets/vendors/";

  React.useEffect(() => {
    if (!isEditing) return;
    trackEvent("vendor_profile_edit", {
      vendor_profile_id: initialData?.id,
      surface: "dashboard",
    });
  }, [initialData?.id, isEditing]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<VendorProfileInput>({
    resolver: zodResolver(vendorProfileSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          imageFocalX: initialData.imageFocalX ?? 50,
          imageFocalY: initialData.imageFocalY ?? 50,
          heroImageFocalX: initialData.heroImageFocalX ?? 50,
          heroImageFocalY: initialData.heroImageFocalY ?? 50,
          contactVisible: initialData.contactVisible ?? false,
          socialLinksVisible: initialData.socialLinksVisible ?? false,
        }
      : {
          businessName: "",
          slug: "",
          description: "",
          imageUrl: "",
          imageFocalX: 50,
          imageFocalY: 50,
          heroImageUrl: "",
          heroImageFocalX: 50,
          heroImageFocalY: 50,
          primaryCategory: "",
          serviceAreaLabel: "",
          websiteUrl: "",
          facebookUrl: "",
          instagramUrl: "",
          contactEmail: "",
          contactPhone: "",
          contactVisible: false,
          socialLinksVisible: false,
          galleryUrls: [],
          galleryUrlsText: "",
          specialties: "",
        },
  });

  const businessName = useWatch({ control, name: "businessName" });
  const slugValue = useWatch({ control, name: "slug" });
  const imageUrl = useWatch({ control, name: "imageUrl" });
  const heroImageUrl = useWatch({ control, name: "heroImageUrl" });
  const galleryUrls = useWatch({ control, name: "galleryUrls" }) ?? [];
  const suggestedSlug = slugify(businessName ?? "") || "your-business-name";
  const previewSlug = (slugValue?.trim() || (isEditing ? initialData?.slug : "") || suggestedSlug)
    .trim()
    .toLowerCase();

  async function onSubmit(data: VendorProfileInput) {
    setServerError(null);

    const payload: Record<string, unknown> = { ...data };
    payload.slug = (data.slug ?? "").trim();
    payload.galleryUrls = (data.galleryUrls ?? []).slice(0, 6);
    payload.contactVisible = Boolean(data.contactVisible);
    payload.socialLinksVisible = Boolean(data.socialLinksVisible);
    delete payload.galleryUrlsText;

    const method = isEditing ? "PUT" : "POST";
    const res = await fetch("/api/vendor/profile", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      trackApiError("vendor_profile", res.status, { reason: "server" });
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Something went wrong");
      return;
    }

    if (!isEditing) {
      trackMilestoneEvent("vendor_profile_publish", {
        surface: "dashboard",
      });
    }
    router.push(isEditing ? "/vendor/dashboard" : "/vendor/dashboard?onboarding=1");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Edit Vendor Profile" : "Create Vendor Profile"}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Update your business information below."
              : "Set up your vendor profile to list where you'll be selling next."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <FormErrorBanner message={serverError} />

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                placeholder="e.g. Sunshine Farm Produce"
                {...register("businessName")}
              />
              {errors.businessName && (
                <p className="text-sm text-destructive">
                  {errors.businessName.message}
                </p>
              )}
            </div>
            <div className="sm:pt-6">
              <ImageUploadWithUrl
                value={imageUrl ?? ""}
                onChange={(url) => setValue("imageUrl", url)}
                uploadType="vendor"
                disabled={isSubmitting}
                label="Profile image"
                aspectRatio="square"
              />
              {errors.imageUrl && (
                <p className="text-sm text-destructive">
                  {errors.imageUrl.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cover image (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Wide banner above your profile. Your profile image above stays as your logo or avatar.
            </p>
            <ImageUploadWithUrl
              value={heroImageUrl ?? ""}
              onChange={(url) => setValue("heroImageUrl", url)}
              uploadType="vendor"
              disabled={isSubmitting}
              label="Cover image"
              aspectRatio="banner"
            />
          </div>
          <div className="space-y-2">
            <Label>Your profile URL</Label>
            <div className="flex items-center overflow-hidden rounded-md border border-border">
              <Input
                placeholder={suggestedSlug}
                className="border-0 font-mono shadow-none focus-visible:ring-0"
                {...register("slug")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Optional. Leave blank to auto-generate from your business name.
            </p>
            <p className="rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-sm text-muted-foreground">
              Preview: {profileUrlPrefix}{previewSlug}
            </p>
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell customers what you sell and what makes your products special..."
              rows={4}
              {...register("description")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primaryCategory">Primary category</Label>
              <Input
                id="primaryCategory"
                placeholder="e.g. Produce, Baked goods, Crafts"
                {...register("primaryCategory")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceAreaLabel">Service area</Label>
              <Input
                id="serviceAreaLabel"
                placeholder="e.g. Spokane Valley, North Spokane"
                {...register("serviceAreaLabel")}
              />
              <p className="text-xs text-muted-foreground">
                General area only — not your home address.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialties">Specialties</Label>
            <Textarea
              id="specialties"
              placeholder="e.g. Organic vegetables, artisan bread, handmade soaps"
              rows={2}
              {...register("specialties")}
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">Public visibility</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Contact and links are hidden on your public page unless you turn these on.
            </p>
            <div className="mt-3 flex flex-wrap gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  {...register("contactVisible")}
                />
                <span className="text-sm">Show email and phone on public profile</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  {...register("socialLinksVisible")}
                />
                <span className="text-sm">Show website and social links</span>
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="contact@example.com"
                {...register("contactEmail")}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Only shown publicly if &quot;Show email and phone&quot; is on.
              </p>
              {errors.contactEmail && (
                <p className="text-sm text-destructive">
                  {errors.contactEmail.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <PhoneInput
                id="contactPhone"
                {...register("contactPhone")}
              />
              {errors.contactPhone && (
                <p className="text-sm text-destructive">
                  {errors.contactPhone.message}
                </p>
              )}
            </div>
          </div>

          <GalleryImageDropzone
            value={galleryUrls}
            onChange={(urls) =>
              setValue("galleryUrls", urls, { shouldDirty: true, shouldValidate: true })
            }
            disabled={isSubmitting}
            maxImages={6}
          />
          {errors.galleryUrls && (
            <p className="text-sm text-destructive">
              {errors.galleryUrls.message as string}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website</Label>
              <Input
                id="websiteUrl"
                type="text"
                placeholder="www.example.com or https://..."
                {...register("websiteUrl")}
              />
              {errors.websiteUrl && (
                <p className="text-sm text-destructive">
                  {errors.websiteUrl.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook username</Label>
              <Input
                id="facebookUrl"
                type="text"
                placeholder="username"
                {...register("facebookUrl")}
              />
              {errors.facebookUrl && (
                <p className="text-sm text-destructive">
                  {errors.facebookUrl.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram username</Label>
              <Input
                id="instagramUrl"
                type="text"
                placeholder="username"
                {...register("instagramUrl")}
              />
              {errors.instagramUrl && (
                <p className="text-sm text-destructive">
                  {errors.instagramUrl.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Update Profile"
                : "Create Profile"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
