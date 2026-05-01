"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors, type FieldValues, type Resolver, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  organizerMarketCreateSchema,
  type OrganizerMarketCreateInput,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import type { NeighborhoodOption } from "@/lib/neighborhoods-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PhoneInput } from "@/components/phone-input";
import { ImageUploadWithUrl } from "@/components/image-upload-with-url";
import { trackEvent } from "@/lib/analytics";
import { OrganizerOnboardingFieldsGroup } from "@/components/organizer-onboarding-fields";
import { organizerOnboardingReadinessHints } from "@/lib/validations/organizer-onboarding";
import type { ListingCommunityBadgeOption } from "@/lib/listing-community-badges";

interface OrganizerMarketCreateFormProps {
  venues: Array<{ id: string; name: string }>;
  neighborhoods: NeighborhoodOption[];
  listingCommunityBadgeOptions: ListingCommunityBadgeOption[];
}

export function OrganizerMarketCreateForm({
  venues,
  neighborhoods,
  listingCommunityBadgeOptions,
}: OrganizerMarketCreateFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrganizerMarketCreateInput>({
    resolver: zodResolver(organizerMarketCreateSchema) as Resolver<OrganizerMarketCreateInput>,
    defaultValues: {
      name: "",
      slug: "",
      venueId: "",
      description: "",
      imageUrl: "",
      imageFocalX: 50,
      imageFocalY: 50,
      websiteUrl: "",
      facebookUrl: "",
      instagramUrl: "",
      baseArea: "",
      typicalSchedule: "",
      contactEmail: "",
      contactPhone: "",
      participationMode: "OPEN",
      vendorCapacity: null,
      publicIntentListEnabled: true,
      publicIntentNamesEnabled: true,
      publicRosterEnabled: true,
      listingCommunityBadgeIds: [],
      organizerPublicContact: false,
      termsAttested: false,
    },
  });

  const watchName = watch("name");
  const watchImageUrl = watch("imageUrl");
  const formValues = watch();
  const readinessHints = organizerOnboardingReadinessHints(formValues);

  const onSubmit = async (data: OrganizerMarketCreateInput) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/organizer/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?.message || body.error || "Failed to create market");
      }

      trackEvent("organizer_market_created", { surface: "organizer_market_create" });
      router.push("/organizer/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      trackEvent("organizer_market_create_error", { surface: "organizer_market_create" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      {error ? (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Market name</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Public URL slug</Label>
        <div className="flex gap-2">
          <Input id="slug" {...register("slug")} className="flex-1" />
          <Button type="button" variant="outline" onClick={() => setValue("slug", slugify(watchName))}>
            Auto
          </Button>
        </div>
        {errors.slug ? <p className="text-sm text-destructive">{errors.slug.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="venueId">Venue</Label>
        <Select id="venueId" {...register("venueId")}>
          <option value="">Select a venue...</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name}
            </option>
          ))}
        </Select>
        {errors.venueId ? <p className="text-sm text-destructive">{errors.venueId.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} {...register("description")} />
      </div>

      <ImageUploadWithUrl
        value={watchImageUrl ?? ""}
        onChange={(url) => setValue("imageUrl", url)}
        uploadType="market"
        label="Market image"
        aspectRatio="banner"
      />
      <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <div>
          <p className="text-sm font-medium">Website &amp; social</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Optional — use full URLs (e.g. https://example.com or https://instagram.com/yourhandle).
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website</Label>
            <Input
              id="websiteUrl"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://yourmarket.com"
              {...register("websiteUrl")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook</Label>
              <Input
                id="facebookUrl"
                type="url"
                inputMode="url"
                placeholder="https://facebook.com/yourpage"
                {...register("facebookUrl")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input
                id="instagramUrl"
                type="url"
                inputMode="url"
                placeholder="https://instagram.com/yourhandle"
                {...register("instagramUrl")}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseArea">Neighborhood</Label>
        <Select id="baseArea" {...register("baseArea")}>
          <option value="">Select neighborhood…</option>
          {neighborhoods.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" type="email" {...register("contactEmail")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Contact phone</Label>
          <PhoneInput id="contactPhone" {...register("contactPhone")} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-foreground">
          Community trust badges
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Self-identified badges shown publicly on your market profile.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {listingCommunityBadgeOptions.map((badge) => (
            <label
              key={badge.id}
              className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-background/80 px-3 py-2"
            >
              <input
                type="checkbox"
                value={badge.id}
                className="mt-0.5 rounded border-border"
                {...register("listingCommunityBadgeIds")}
              />
              <span className="text-sm">{badge.name}</span>
            </label>
          ))}
        </div>
        {errors.listingCommunityBadgeIds && (
          <p className="mt-2 text-sm text-destructive">
            {errors.listingCommunityBadgeIds.message as string}
          </p>
        )}
      </div>

      {readinessHints.length > 0 && (
        <div className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Listing readiness (optional)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {readinessHints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      <OrganizerOnboardingFieldsGroup
        register={register as unknown as UseFormRegister<FieldValues>}
        errors={errors as unknown as FieldErrors<FieldValues>}
        idPrefix="mkt-new"
      />

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Market"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
