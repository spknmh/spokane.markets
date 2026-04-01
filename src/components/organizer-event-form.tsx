"use client";

import { trackApiError, trackEvent } from "@/lib/analytics";
import {
  useForm,
  useFieldArray,
  type FieldErrors,
  type FieldValues,
  type Resolver,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  organizerEventSchema,
  type OrganizerEventInput,
} from "@/lib/validations";
import { formatDateOnlyLocal, formatDateOnlyUTC, slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Switch } from "@/components/ui/switch";
import { ImageUploadWithUrl } from "@/components/image-upload-with-url";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ScheduleRecurringGenerator } from "@/components/schedule-recurring-generator";
import { AddressAutofillFields } from "@/components/address-autocomplete";
import { OrganizerOnboardingFieldsGroup } from "@/components/organizer-onboarding-fields";
import { organizerOnboardingReadinessHints } from "@/lib/validations/organizer-onboarding";

type ScheduleDay = {
  date: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
};

const DEFAULT_START_TIME = "08:00";
const DEFAULT_END_TIME = "14:00";

function buildTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const labelHour = hour % 12 || 12;
      const labelMinute = String(minute).padStart(2, "0");
      const period = hour >= 12 ? "PM" : "AM";
      options.push({ value, label: `${labelHour}:${labelMinute} ${period}` });
    }
  }
  const pivot = options.findIndex((opt) => opt.value === DEFAULT_START_TIME);
  if (pivot <= 0) return options;
  return [...options.slice(pivot), ...options.slice(0, pivot)];
}

const TIME_OPTIONS = buildTimeOptions();

function toScheduleDay(start: Date, end: Date): ScheduleDay {
  const d = new Date(start);
  const date = formatDateOnlyUTC(d);
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

  const today = formatDateOnlyLocal(new Date());
  const defaultSchedule =
    initialData?.scheduleDays?.length
      ? initialData.scheduleDays
      : initialData?.startDate && initialData?.endDate
        ? [toScheduleDay(new Date(initialData.startDate), new Date(initialData.endDate))]
        : [
            {
              date: today,
              allDay: true as const,
              startTime: DEFAULT_START_TIME,
              endTime: DEFAULT_END_TIME,
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
    resolver: zodResolver(organizerEventSchema) as Resolver<OrganizerEventInput>,
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
          venueName: "",
          venueAddress: "",
          venueCity: "Spokane",
          venueState: "WA",
          venueZip: "",
          venueLat: undefined,
          venueLng: undefined,
          marketId: "",
          imageUrl: "",
          showImageInList: false,
          imageFocalX: 50,
          imageFocalY: 50,
          websiteUrl: "",
          facebookUrl: "",
          instagramUrl: "",
          tagIds: [],
          featureIds: [],
          scheduleDays: defaultSchedule,
          organizerPublicContact: false,
          termsAttested: false,
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
  const watchShowImageInList = watch("showImageInList") ?? false;
  const watchTagIds = watch("tagIds") ?? [];
  const watchFeatureIds = watch("featureIds") ?? [];
  const formValues = watch();
  const readinessHints = organizerOnboardingReadinessHints(formValues);

  useEffect(() => {
    if (watchMarketId && !watchVenueId) {
      const market = markets.find((m) => m.id === watchMarketId);
      if (market?.venueId) setValue("venueId", market.venueId);
    }
  }, [watchMarketId, watchVenueId, markets, setValue]);

  const watchScheduleDays = watch("scheduleDays");
  useEffect(() => {
    const days = watchScheduleDays ?? [];
    let changed = false;
    const normalized = days.map((day) => {
      if (day.allDay) return day;
      const nextStart = day.startTime || DEFAULT_START_TIME;
      const nextEnd = day.endTime || DEFAULT_END_TIME;
      if (nextStart !== day.startTime || nextEnd !== day.endTime) changed = true;
      return { ...day, startTime: nextStart, endTime: nextEnd };
    });
    if (changed) {
      setValue("scheduleDays", normalized, { shouldDirty: true, shouldValidate: true });
      return;
    }
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
        trackApiError("organizer_events", res.status, { reason: "server" });
        const body = await res.json();
        throw new Error(body.error?.message || "Failed to save event");
      }

      if (initialData?.id) {
        trackEvent("event_edit_success", {
          event_id: initialData.id,
          surface: "dashboard",
        });
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
          Add one or more days. Default is one day, all day. Uncheck All day to use 8:00 AM as the default start.
        </p>
        <ScheduleRecurringGenerator onGenerate={(days) => replace(days)} />
        {fields.map((field, i) => (
          <div
            key={field.id}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
          >
            <div className="space-y-2 min-w-[140px]">
              <Label>Date</Label>
              <DatePickerInput
                value={watch(`scheduleDays.${i}.date`) || ""}
                onChange={(value) =>
                  setValue(`scheduleDays.${i}.date`, value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register(`scheduleDays.${i}.allDay`)} />
              <span className="text-sm">All day</span>
            </label>
            {!watch(`scheduleDays.${i}.allDay`) && (
              <>
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Select {...register(`scheduleDays.${i}.startTime`)}>
                    <option value="">Select start time (default 8:00 AM)</option>
                    {TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Select {...register(`scheduleDays.${i}.endTime`)}>
                    <option value="">Select end time (default 2:00 PM)</option>
                    {TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
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
              date: formatDateOnlyLocal(new Date()),
              allDay: true,
              startTime: DEFAULT_START_TIME,
              endTime: DEFAULT_END_TIME,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add another day
        </Button>
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
                  setValue("venueLat", undefined);
                  setValue("venueLng", undefined);
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
              <Label className="text-muted-foreground">Address details (editable)</Label>
              <p className="text-xs text-muted-foreground">
                Start typing in the street address field for suggestions.
              </p>
              <AddressAutofillFields
                onRetrieve={(addr) => {
                  setValue("venueId", "");
                  setValue("venueLat", addr.lat);
                  setValue("venueLng", addr.lng);
                }}
                streetProps={{
                  id: "venueAddress",
                  ...register("venueAddress", { onChange: () => setValue("venueId", "") }),
                }}
                cityProps={register("venueCity")}
                stateProps={register("venueState")}
                zipProps={register("venueZip")}
              />
              {errors.venueAddress && (
                <p className="text-sm text-destructive">{errors.venueAddress.message}</p>
              )}
              {(errors.venueCity || errors.venueState || errors.venueZip) && (
                <p className="text-sm text-destructive">
                  {errors.venueCity?.message || errors.venueState?.message || errors.venueZip?.message}
                </p>
              )}
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
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <Label htmlFor="showImageInList">Show event image on /events cards</Label>
            <p className="text-xs text-muted-foreground">
              Optional. Displays a small profile-style image on event listing cards.
            </p>
          </div>
          <Switch
            id="showImageInList"
            checked={watchShowImageInList}
            onCheckedChange={(checked) =>
              setValue("showImageInList", checked, { shouldDirty: true })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input id="websiteUrl" type="url" {...register("websiteUrl")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="facebookUrl">Facebook URL</Label>
          <Input id="facebookUrl" type="url" {...register("facebookUrl")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instagramUrl">Instagram URL</Label>
          <Input id="instagramUrl" type="url" {...register("instagramUrl")} />
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
        idPrefix="evt"
      />

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
