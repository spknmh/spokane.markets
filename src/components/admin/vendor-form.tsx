"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminVendorProfileSchema,
  type AdminVendorProfileInput,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface AdminVendorFormProps {
  initialData?: AdminVendorProfileInput & { id: string };
}

export function AdminVendorForm({ initialData }: AdminVendorFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const isEditing = !!initialData?.id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdminVendorProfileInput>({
    resolver: zodResolver(adminVendorProfileSchema),
    defaultValues: initialData ?? {
      businessName: "",
      slug: "",
      description: "",
      imageUrl: "",
      websiteUrl: "",
      facebookUrl: "",
      instagramUrl: "",
      contactEmail: "",
      contactPhone: "",
      galleryUrlsText: "",
      specialties: "",
      userId: null,
      contactVisible: true,
      socialLinksVisible: true,
    },
  });

  const businessName = watch("businessName");
  const slugValue = watch("slug");
  const suggestedSlug = slugify(businessName ?? "") || "vendor";

  const handleSlugFromName = () => {
    if (!slugValue && businessName) {
      setValue("slug", suggestedSlug);
    }
  };

  async function onSubmit(data: AdminVendorProfileInput) {
    setServerError(null);

    const payload: Record<string, unknown> = { ...data };
    const text = (payload.galleryUrlsText as string) ?? "";
    payload.galleryUrls = text
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.startsWith("http"));
    delete payload.galleryUrlsText;

    const url = isEditing
      ? `/api/admin/vendors/${initialData!.id}`
      : "/api/admin/vendors";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Something went wrong");
      return;
    }

    router.push("/admin/vendors");
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
              ? "Update vendor profile. Slug changes affect the public URL."
              : "Create a new vendor profile. Leave slug empty to auto-generate from business name."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {serverError && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

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

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                placeholder={suggestedSlug}
                {...register("slug")}
                className="font-mono"
              />
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSlugFromName}
                >
                  From name
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              URL path: /vendors/[slug]. Lowercase letters, numbers, hyphens only.
              Leave empty to auto-generate.
            </p>
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="userId">User ID (optional)</Label>
            <Input
              id="userId"
              placeholder="cuid to link profile to a user"
              {...register("userId")}
            />
            <p className="text-xs text-muted-foreground">
              Link this profile to a user account. Leave empty for unclaimed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell customers what you sell..."
              rows={4}
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialties">Specialties</Label>
            <Textarea
              id="specialties"
              placeholder="e.g. Organic vegetables, artisan bread"
              rows={2}
              {...register("specialties")}
            />
          </div>

          <ImageUploadWithUrl
            value={watch("imageUrl") ?? ""}
            onChange={(url) => setValue("imageUrl", url)}
            uploadType="vendor"
            disabled={isSubmitting}
            label="Profile image"
            aspectRatio="square"
          />
          {errors.imageUrl && (
            <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
          )}

          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={watch("contactVisible") ?? true}
                onChange={(e) => setValue("contactVisible", e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm">Contact info visible</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={watch("socialLinksVisible") ?? true}
                onChange={(e) => setValue("socialLinksVisible", e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm">Social links visible</span>
            </label>
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
              {errors.contactEmail && (
                <p className="text-sm text-destructive">
                  {errors.contactEmail.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="(509) 555-0123"
                {...register("contactPhone")}
              />
              {errors.contactPhone && (
                <p className="text-sm text-destructive">
                  {errors.contactPhone.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="galleryUrlsText">Gallery Images</Label>
            <Textarea
              id="galleryUrlsText"
              placeholder="One image URL per line"
              rows={3}
              {...register("galleryUrlsText")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://..."
                {...register("websiteUrl")}
              />
              {errors.websiteUrl && (
                <p className="text-sm text-destructive">
                  {errors.websiteUrl.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook</Label>
              <Input
                id="facebookUrl"
                type="url"
                placeholder="https://facebook.com/..."
                {...register("facebookUrl")}
              />
              {errors.facebookUrl && (
                <p className="text-sm text-destructive">
                  {errors.facebookUrl.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input
                id="instagramUrl"
                type="url"
                placeholder="https://instagram.com/..."
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
          <Button type="button" variant="ghost" onClick={() => router.back()}>
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
