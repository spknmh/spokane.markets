"use client";

import { useForm, type FieldErrors, type FieldValues, type Resolver, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  organizerMarketPatchSchema,
  type OrganizerMarketPatchInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUploadWithUrl } from "@/components/image-upload-with-url";
import { ImageFocalSliders } from "@/components/image-focal-sliders";
import type { NeighborhoodOption } from "@/lib/neighborhoods-config";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OrganizerOnboardingFieldsGroup } from "@/components/organizer-onboarding-fields";
import { organizerOnboardingReadinessHints } from "@/lib/validations/organizer-onboarding";

interface OrganizerMarketFormProps {
  marketId: string;
  initialData: OrganizerMarketPatchInput;
  neighborhoods: NeighborhoodOption[];
}

export function OrganizerMarketForm({
  marketId,
  initialData,
  neighborhoods,
}: OrganizerMarketFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrganizerMarketPatchInput>({
    resolver: zodResolver(organizerMarketPatchSchema) as Resolver<OrganizerMarketPatchInput>,
    defaultValues: initialData,
  });

  const watchImageUrl = watch("imageUrl");
  const formValues = watch();
  const readinessHints = organizerOnboardingReadinessHints(formValues);

  const onSubmit = async (data: OrganizerMarketPatchInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/organizer/markets/${marketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?.message || "Failed to save market");
      }

      router.push("/organizer/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Venue and slug cannot be changed. Contact an admin if those need updating.
      </p>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
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
      {watchImageUrl?.trim() ? (
        <ImageFocalSliders register={register} idPrefix="organizer-market" />
      ) : null}

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
        <Label htmlFor="baseArea">Neighborhood</Label>
        <select
          id="baseArea"
          {...register("baseArea")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Select neighborhood…</option>
          {neighborhoods.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="typicalSchedule">Typical Schedule</Label>
        <Input
          id="typicalSchedule"
          placeholder="e.g. Every Saturday, May-October"
          {...register("typicalSchedule")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input id="contactEmail" type="email" {...register("contactEmail")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Contact Phone</Label>
          <PhoneInput id="contactPhone" {...register("contactPhone")} />
        </div>
      </div>

      {readinessHints.length > 0 && (
        <div className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Before you publish or request verification</p>
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
        idPrefix="mkt-edit"
      />

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Update Market"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
