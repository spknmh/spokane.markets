"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  organizerEventSchema,
  type OrganizerEventInput,
} from "@/lib/validations";
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
import { Plus, Trash2 } from "lucide-react";
import { ScheduleRecurringGenerator } from "@/components/schedule-recurring-generator";

type ScheduleDay = {
  date: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
};

function toScheduleDay(start: Date, end: Date): ScheduleDay {
  const d = new Date(start);
  const date = d.toISOString().slice(0, 10);
  const startMidnight = d.getHours() === 0 && d.getMinutes() === 0;
  const endLate =
    (end.getHours() === 23 && end.getMinutes() === 59) ||
    (end.getHours() === 0 && end.getMinutes() === 0 && end > d);
  const allDay = startMidnight && endLate;
  return {
    date,
    allDay,
    startTime: allDay ? undefined : d.toTimeString().slice(0, 5),
    endTime: allDay ? undefined : new Date(end).toTimeString().slice(0, 5),
  };
}

interface OrganizerEventFormProps {
  venues: { id: string; name: string }[];
  markets: { id: string; name: string; venueId: string }[];
  tags: { id: string; name: string; slug: string }[];
  features: { id: string; name: string; slug: string }[];
  initialData?: OrganizerEventInput & { id: string; scheduleDays?: ScheduleDay[] };
}

export function OrganizerEventForm({
  venues,
  markets,
  tags,
  features,
  initialData,
}: OrganizerEventFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const defaultSchedule =
    initialData?.scheduleDays?.length
      ? initialData.scheduleDays
      : initialData?.startDate && initialData?.endDate
        ? [toScheduleDay(new Date(initialData.startDate), new Date(initialData.endDate))]
        : [
            {
              date: today,
              allDay: true as const,
            },
          ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<OrganizerEventInput>({
    resolver: zodResolver(organizerEventSchema),
    defaultValues: initialData
      ? { ...initialData, scheduleDays: defaultSchedule }
      : {
          title: "",
          slug: "",
          description: "",
          startDate: `${today}T00:00:00`,
          endDate: `${today}T23:59:00`,
          timezone: "",
          venueId: "",
          marketId: "",
          imageUrl: "",
          websiteUrl: "",
          facebookUrl: "",
          tagIds: [],
          featureIds: [],
          scheduleDays: defaultSchedule,
        },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "scheduleDays",
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

  const watchScheduleDays = watch("scheduleDays");
  useEffect(() => {
    const days = watchScheduleDays ?? [];
    if (days.length) {
      const first = days[0];
      const last = days[days.length - 1];
      const firstStart = first.allDay ? "00:00" : (first.startTime ?? "00:00");
      const lastEnd = last.allDay ? "23:59" : (last.endTime ?? "23:59");
      setValue("startDate", `${first.date}T${firstStart}:00`);
      setValue("endDate", `${last.date}T${lastEnd}:00`);
    }
  }, [watchScheduleDays, setValue]);

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

  const onSubmit = async (data: OrganizerEventInput) => {
    setSubmitting(true);
    setError(null);

    const scheduleDays = data.scheduleDays ?? [];
    if (scheduleDays.length) {
      const first = scheduleDays[0];
      const last = scheduleDays[scheduleDays.length - 1];
      const firstStart = first.allDay ? "00:00" : (first.startTime ?? "00:00");
      const lastEnd = last.allDay ? "23:59" : (last.endTime ?? "23:59");
      data.startDate = `${first.date}T${firstStart}:00`;
      data.endDate = `${last.date}T${lastEnd}:00`;
    }

    try {
      const url = initialData
        ? `/api/organizer/events/${initialData.id}`
        : "/api/organizer/events";
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

      router.push("/organizer/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => setError("Please fix the errors below."))}
      className="max-w-2xl space-y-6"
    >
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
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

      <div className="space-y-4">
        <Label>Schedule</Label>
        <p className="text-xs text-muted-foreground">
          Add one or more days. Default is one day, all day. Uncheck All day to set times.
        </p>
        <ScheduleRecurringGenerator onGenerate={(days) => replace(days)} />
        {fields.map((field, i) => (
          <div
            key={field.id}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
          >
            <div className="space-y-2 min-w-[140px]">
              <Label>Date</Label>
              <Input type="date" {...register(`scheduleDays.${i}.date`)} />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register(`scheduleDays.${i}.allDay`)} />
              <span className="text-sm">All day</span>
            </label>
            {!watch(`scheduleDays.${i}.allDay`) && (
              <>
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Input type="time" {...register(`scheduleDays.${i}.startTime`)} />
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Input type="time" {...register(`scheduleDays.${i}.endTime`)} />
                </div>
              </>
            )}
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(i)}
                aria-label="Remove day"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              date: new Date().toISOString().slice(0, 10),
              allDay: true,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add another day
        </Button>
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

      {markets.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="marketId">Your Market (optional)</Label>
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
      )}

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
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
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
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
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
              : "Submit Event"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
