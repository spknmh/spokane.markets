"use client";

import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventInput } from "@/lib/validations";
import { slugify } from "@/lib/utils";
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

interface EventFormProps {
  venues: { id: string; name: string }[];
  markets: { id: string; name: string; venueId: string }[];
  tags: { id: string; name: string; slug: string }[];
  features: { id: string; name: string; slug: string }[];
  initialData?: EventInput & { id: string; scheduleDays?: ScheduleDay[] };
}

export function EventForm({ venues, markets, tags, features, initialData }: EventFormProps) {
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
  } = useForm<EventInput>({
    resolver: zodResolver(eventSchema) as Resolver<EventInput>,
    defaultValues: initialData
      ? {
          ...initialData,
          scheduleDays: defaultSchedule,
        }
      : {
          title: "",
          slug: "",
          description: "",
          startDate: `${today}T00:00:00`,
          endDate: `${today}T23:59:00`,
          timezone: "",
          venueId: "",
          venueName: "",
          venueAddress: "",
          venueCity: "Spokane",
          venueState: "WA",
          venueZip: "",
          marketId: "",
          imageUrl: "",
          status: "DRAFT",
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
  const useInlineAddress = !watchVenueId;
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

  const onSubmit = async (data: EventInput) => {
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
    <form
      onSubmit={handleSubmit(onSubmit, (err) => {
        setError("Please fix the errors below.");
      })}
      className="space-y-6 max-w-2xl"
    >
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
              <Input
                type="date"
                {...register(`scheduleDays.${i}.date`)}
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register(`scheduleDays.${i}.allDay`)}
              />
              <span className="text-sm">All day</span>
            </label>
            {!watch(`scheduleDays.${i}.allDay`) && (
              <>
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Input
                    type="time"
                    {...register(`scheduleDays.${i}.startTime`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Input
                    type="time"
                    {...register(`scheduleDays.${i}.endTime`)}
                  />
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

      <div className="space-y-4 rounded-lg border border-border p-4">
        <Label>Location</Label>
        <p className="text-xs text-muted-foreground">
          Select a venue or enter an address. Either is required.
        </p>
        <div className="space-y-2">
          <Label htmlFor="venueId" className="text-sm font-normal">Venue (optional)</Label>
          <Select
            id="venueId"
            {...register("venueId", {
              onChange: (e) => {
                if (e.target.value) {
                  setValue("venueName", "");
                  setValue("venueAddress", "");
                  setValue("venueCity", "Spokane");
                  setValue("venueState", "WA");
                  setValue("venueZip", "");
                }
              },
            })}
          >
            <option value="">Or enter address below...</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </Select>
        </div>
        {useInlineAddress && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <p className="text-sm font-medium text-muted-foreground">Enter address</p>
            <div className="space-y-2">
              <Label htmlFor="venueName">Location name</Label>
              <Input
                id="venueName"
                placeholder="e.g. Riverside Park Pavilion"
                {...register("venueName", {
                  onChange: () => setValue("venueId", ""),
                })}
              />
              {errors.venueName && (
                <p className="text-sm text-destructive">{errors.venueName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueAddress">Street address</Label>
              <Input
                id="venueAddress"
                placeholder="123 Main St"
                {...register("venueAddress", {
                  onChange: () => setValue("venueId", ""),
                })}
              />
              {errors.venueAddress && (
                <p className="text-sm text-destructive">{errors.venueAddress.message}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="venueCity">City</Label>
                <Input id="venueCity" {...register("venueCity")} />
                {errors.venueCity && (
                  <p className="text-sm text-destructive">{errors.venueCity.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="venueState">State</Label>
                <Input id="venueState" {...register("venueState")} />
                {errors.venueState && (
                  <p className="text-sm text-destructive">{errors.venueState.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="venueZip">ZIP</Label>
                <Input id="venueZip" {...register("venueZip")} placeholder="99201" />
                {errors.venueZip && (
                  <p className="text-sm text-destructive">{errors.venueZip.message}</p>
                )}
              </div>
            </div>
          </div>
        )}
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

      <details className="rounded-lg border border-border">
        <summary className="cursor-pointer p-4 font-medium">
          Vendor participation (override market)
        </summary>
        <div className="space-y-4 border-t border-border p-4">
          <p className="text-xs text-muted-foreground">
            Override the market&apos;s vendor participation settings for this event. Leave as default to use market settings.
          </p>
          <div className="space-y-2">
            <Label htmlFor="participationMode">Participation mode</Label>
            <Select id="participationMode" {...register("participationMode")}>
              <option value="">Use market default</option>
              <option value="OPEN">Mark as attending</option>
              <option value="REQUEST_TO_JOIN">Request to join</option>
              <option value="INVITE_ONLY">Invite only / Juried</option>
              <option value="CAPACITY_LIMITED">Request to join (capacity limited)</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventVendorCapacity">Vendor capacity</Label>
            <Input
              id="eventVendorCapacity"
              type="number"
              min={0}
              placeholder="Use market default"
              {...register("vendorCapacity", {
                setValueAs: (v) =>
                  v === "" || v === undefined || Number.isNaN(Number(v))
                    ? undefined
                    : Number(v),
              })}
            />
          </div>
          <div className="space-y-2">
            <Label>Display options</Label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register("publicIntentListEnabled")} />
                <span className="text-sm">Show self-reported list</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register("publicIntentNamesEnabled")} />
                <span className="text-sm">Show names</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register("publicRosterEnabled")} />
                <span className="text-sm">Show official roster</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Uncheck to use market default. Leave checked to override.
            </p>
          </div>
        </div>
      </details>

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
