"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventInput } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { US_TIMEZONES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ImageUploadWithUrl } from "@/components/image-upload-with-url";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface EventFormProps {
  venues: { id: string; name: string }[];
  markets: { id: string; name: string; venueId: string }[];
  tags: { id: string; name: string; slug: string }[];
  features: { id: string; name: string; slug: string }[];
  initialData?: EventInput & { id: string };
}

export function EventForm({ venues, markets, tags, features, initialData }: EventFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData ?? {
      title: "",
      slug: "",
      description: "",
      startDate: "",
      endDate: "",
      timezone: "",
      venueId: "",
      marketId: "",
      imageUrl: "",
      status: "DRAFT",
      websiteUrl: "",
      facebookUrl: "",
      tagIds: [],
      featureIds: [],
    },
  });

  const watchTitle = watch("title");
  const watchMarketId = watch("marketId");
  const watchVenueId = watch("venueId");
  const watchImageUrl = watch("imageUrl");
  const watchTagIds = watch("tagIds") ?? [];
  const watchFeatureIds = watch("featureIds") ?? [];

  useEffect(() => {
    if (watchMarketId && !watchVenueId) {
      const market = markets.find((m) => m.id === watchMarketId);
      if (market?.venueId) setValue("venueId", market.venueId);
    }
  }, [watchMarketId, watchVenueId, markets, setValue]);

  const autoSlug = () => {
    setValue("slug", slugify(watchTitle));
  };

  const toggleArrayItem = (
    field: "tagIds" | "featureIds",
    current: string[],
    id: string
  ) => {
    setValue(
      field,
      current.includes(id)
        ? current.filter((v) => v !== id)
        : [...current, id]
    );
  };

  const onSubmit = async (data: EventInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const url = initialData
        ? `/api/admin/events/${initialData.id}`
        : "/api/admin/events";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?.message || "Failed to save event");
      }

      router.push("/admin/events");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <div className="flex gap-2">
          <Input id="slug" {...register("slug")} className="flex-1" />
          <Button type="button" variant="outline" onClick={autoSlug}>
            Auto
          </Button>
        </div>
        {errors.slug && (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" type="datetime-local" {...register("startDate")} />
          {errors.startDate && (
            <p className="text-sm text-destructive">{errors.startDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" type="datetime-local" {...register("endDate")} />
          {errors.endDate && (
            <p className="text-sm text-destructive">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone (optional)</Label>
        <Select id="timezone" {...register("timezone")}>
          <option value="">Use browser/server time</option>
          {US_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="marketId">Market (optional)</Label>
        <Select id="marketId" {...register("marketId")}>
          <option value="">None</option>
          {markets.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">
          Selecting a market will default the venue below.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="venueId">Venue</Label>
        <Select id="venueId" {...register("venueId")}>
          <option value="">Select a venue...</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
        {errors.venueId && (
          <p className="text-sm text-destructive">{errors.venueId.message}</p>
        )}
      </div>

      <ImageUploadWithUrl
        value={watchImageUrl ?? ""}
        onChange={(url) => setValue("imageUrl", url)}
        uploadType="event"
        label="Event image"
        aspectRatio="banner"
      />

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select id="status" {...register("status")}>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending Review</option>
          <option value="PUBLISHED">Published</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

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
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <label
              key={tag.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary"
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={watchTagIds.includes(tag.id)}
                onChange={() => toggleArrayItem("tagIds", watchTagIds, tag.id)}
              />
              {tag.name}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Features</Label>
        <div className="flex flex-wrap gap-2">
          {features.map((feature) => (
            <label
              key={feature.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary"
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={watchFeatureIds.includes(feature.id)}
                onChange={() =>
                  toggleArrayItem("featureIds", watchFeatureIds, feature.id)
                }
              />
              {feature.name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Saving..."
            : initialData
              ? "Update Event"
              : "Create Event"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
