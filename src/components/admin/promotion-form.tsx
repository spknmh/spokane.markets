"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { promotionSchema, type PromotionInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ImageUploadWithUrl } from "@/components/image-upload-with-url";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PromotionFormProps {
  events: Array<{ id: string; title: string; slug: string; startDate: Date }>;
  initialData?: Partial<PromotionInput> & { id: string };
}

function toDateInputValue(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

export function PromotionForm({ events, initialData }: PromotionFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDateValue = (d: string | Date | undefined): string => {
    if (!d) return "";
    if (typeof d === "string") return d.slice(0, 10);
    return toDateInputValue(d);
  };

  const defaultValues: Partial<PromotionInput> = initialData
    ? {
        eventId: (initialData as { eventId?: string }).eventId ?? "",
        type: (initialData as { type?: PromotionInput["type"] }).type ?? "FEATURED",
        sponsorName: (initialData as { sponsorName?: string | null }).sponsorName ?? "",
        imageUrl: (initialData as { imageUrl?: string }).imageUrl ?? "",
        linkUrl: (initialData as { linkUrl?: string }).linkUrl ?? "",
        startDate: getDateValue((initialData as { startDate?: string | Date }).startDate),
        endDate: getDateValue((initialData as { endDate?: string | Date }).endDate),
        sortOrder: (initialData as { sortOrder?: number }).sortOrder ?? 0,
      }
    : {
        eventId: "",
        type: "FEATURED",
        sponsorName: "",
        imageUrl: "",
        linkUrl: "",
        startDate: "",
        endDate: "",
        sortOrder: 0,
      };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PromotionInput>({
    resolver: zodResolver(promotionSchema),
    defaultValues: defaultValues as PromotionInput,
  });

  const onSubmit = async (data: PromotionInput) => {
    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = { ...data };
      if ("startDate" in payload && payload.startDate) {
        payload.startDate = `${payload.startDate}T00:00:00.000Z`;
      }
      if ("endDate" in payload && payload.endDate) {
        payload.endDate = `${payload.endDate}T23:59:59.999Z`;
      }

      const url = initialData
        ? `/api/admin/promotions/${initialData.id}`
        : "/api/admin/promotions";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?.message || "Failed to save promotion");
      }

      router.push("/admin/promotions");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="eventId">Event</Label>
        <Select id="eventId" {...register("eventId")} required={!initialData}>
          <option value="">Select an event</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} ({toDateInputValue(e.startDate)})
            </option>
          ))}
        </Select>
        {errors.eventId && (
          <p className="text-sm text-destructive">
            {(errors.eventId as { message?: string }).message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select id="type" {...register("type")}>
          <option value="SPONSORED">Sponsored</option>
          <option value="PARTNERSHIP">Partner Spotlight</option>
          <option value="FEATURED">Featured</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sponsorName">Sponsor Name (optional)</Label>
        <Input
          id="sponsorName"
          {...register("sponsorName")}
          placeholder="e.g. Local Business Inc."
        />
      </div>

      <ImageUploadWithUrl
        value={watch("imageUrl") ?? ""}
        onChange={(url) => setValue("imageUrl", url)}
        uploadType="banner"
        label="Promotion image"
        aspectRatio="banner"
      />

      <div className="space-y-2">
        <Label htmlFor="linkUrl">Link URL (optional)</Label>
        <Input
          id="linkUrl"
          type="url"
          placeholder="https://..."
          {...register("linkUrl")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          type="date"
          {...register("startDate")}
          required={!initialData}
        />
        {errors.startDate && (
          <p className="text-sm text-destructive">
            {(errors.startDate as { message?: string }).message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate">End Date</Label>
        <Input
          id="endDate"
          type="date"
          {...register("endDate")}
          required={!initialData}
        />
        {errors.endDate && (
          <p className="text-sm text-destructive">
            {(errors.endDate as { message?: string }).message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sortOrder">Sort Order</Label>
        <Input
          id="sortOrder"
          type="number"
          min={0}
          {...register("sortOrder", { valueAsNumber: true })}
        />
        <p className="text-xs text-muted-foreground">
          Lower numbers appear first in the carousel.
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : initialData ? "Update" : "Create"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/promotions")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
