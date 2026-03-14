"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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

interface OrganizerMarketCreateFormProps {
  venues: Array<{ id: string; name: string }>;
  neighborhoods: NeighborhoodOption[];
}

export function OrganizerMarketCreateForm({
  venues,
  neighborhoods,
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
    resolver: zodResolver(organizerMarketCreateSchema),
    defaultValues: {
      name: "",
      slug: "",
      venueId: "",
      description: "",
      imageUrl: "",
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
    },
  });

  const watchName = watch("name");
  const watchImageUrl = watch("imageUrl");

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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input id="websiteUrl" type="url" {...register("websiteUrl")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="facebookUrl">Facebook URL</Label>
          <Input id="facebookUrl" type="url" {...register("facebookUrl")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instagramUrl">Instagram URL</Label>
        <Input id="instagramUrl" type="url" {...register("instagramUrl")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseArea">Base area</Label>
        <Select id="baseArea" {...register("baseArea")}>
          <option value="">Select area...</option>
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
