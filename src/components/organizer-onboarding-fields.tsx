"use client";

import type { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";
import type { OrganizerOnboardingFieldsInput } from "@/lib/validations/organizer-onboarding";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

interface OrganizerOnboardingFieldsGroupProps {
  /** Parent forms merge onboarding keys into their shape; use widened register for shared fields. */
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors<FieldValues>;
  idPrefix?: string;
}

/**
 * Progressive organizer onboarding / compliance fields (shared by market + event forms).
 */
export function OrganizerOnboardingFieldsGroup({
  register,
  errors,
  idPrefix = "onboarding",
}: OrganizerOnboardingFieldsGroupProps) {
  const e = (name: keyof OrganizerOnboardingFieldsInput) =>
    errors[name as string]?.message as string | undefined;

  return (
    <details className="rounded-lg border border-border bg-muted/15 p-4 open:pb-5">
      <summary className="cursor-pointer text-sm font-medium">
        Listing details &amp; vendor workflow (optional)
      </summary>
      <p className="mt-2 text-xs text-muted-foreground">
        Helps verification and vendor expectations. Contact email/phone above stay private unless you
        opt in below.
      </p>

      <div className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-listingKind`}>Listing type</Label>
            <Select id={`${idPrefix}-listingKind`} {...register("listingKind")}>
              <option value="">Default / unchanged</option>
              <option value="MARKET_BRAND">Market brand</option>
              <option value="EVENT_OCCURRENCE">Single event / occurrence</option>
              <option value="BOTH">Both</option>
            </Select>
            {e("listingKind") && (
              <p className="text-sm text-destructive">{e("listingKind")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-eventType`}>Event type</Label>
            <Select id={`${idPrefix}-eventType`} {...register("eventType")}>
              <option value="">—</option>
              <option value="FARMERS_MARKET">Farmers market</option>
              <option value="CRAFT_FAIR">Craft fair</option>
              <option value="NIGHT_MARKET">Night market</option>
              <option value="POP_UP">Pop-up</option>
              <option value="HOLIDAY_MARKET">Holiday market</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-organizerDisplayName`}>Public organizer display name</Label>
          <Input
            id={`${idPrefix}-organizerDisplayName`}
            placeholder="Shown when you opt in to public contact"
            {...register("organizerDisplayName")}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`${idPrefix}-organizerPublicContact`}
            className="h-4 w-4 rounded border-input"
            {...register("organizerPublicContact")}
          />
          <Label htmlFor={`${idPrefix}-organizerPublicContact`} className="font-normal">
            Show organizer contact publicly (email/phone from this listing)
          </Label>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Leave unchecked to keep email/phone off public pages (recommended default).
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-occurrenceModel`}>Occurrence</Label>
            <Select id={`${idPrefix}-occurrenceModel`} {...register("occurrenceModel")}>
              <option value="">—</option>
              <option value="ONE_TIME">One-time</option>
              <option value="RECURRING">Recurring</option>
              <option value="SEASONAL_SERIES">Seasonal series</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-indoorOutdoor`}>Indoor / outdoor</Label>
            <Select id={`${idPrefix}-indoorOutdoor`} {...register("indoorOutdoor")}>
              <option value="">—</option>
              <option value="INDOOR">Indoor</option>
              <option value="OUTDOOR">Outdoor</option>
              <option value="HYBRID">Hybrid</option>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-shortDescription`}>Short public summary</Label>
          <Textarea
            id={`${idPrefix}-shortDescription`}
            rows={3}
            placeholder="1–3 sentences for discovery cards and summaries"
            {...register("shortDescription")}
          />
          {e("shortDescription") && (
            <p className="text-sm text-destructive">{e("shortDescription")}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-vendorWorkflowMode`}>Vendor workflow</Label>
            <Select id={`${idPrefix}-vendorWorkflowMode`} {...register("vendorWorkflowMode")}>
              <option value="">Default (intent-first)</option>
              <option value="INTENT_ONLY">Intent only (attendance / interest)</option>
              <option value="BOTH">
                Both — official application + casual intent (when participation allows)
              </option>
            </Select>
            <p className="text-xs text-muted-foreground">
              “Both” applies when this listing uses request-to-join or capacity-limited participation.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-vendorApplicationState`}>Vendor applications</Label>
            <Select id={`${idPrefix}-vendorApplicationState`} {...register("vendorApplicationState")}>
              <option value="">Inherit / unchanged</option>
              <option value="NOT_ACCEPTING">Not accepting</option>
              <option value="OPEN">Open</option>
              <option value="WAITLIST">Waitlist</option>
              <option value="CLOSED">Closed</option>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-vendorApplicationDeadline`}>Application deadline (optional)</Label>
          <Input
            id={`${idPrefix}-vendorApplicationDeadline`}
            type="datetime-local"
            {...register("vendorApplicationDeadline")}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`${idPrefix}-termsAttested`}
            className="h-4 w-4 rounded border-input"
            {...register("termsAttested")}
          />
          <Label htmlFor={`${idPrefix}-termsAttested`} className="font-normal">
            I agree to marketplace organizer terms and accuracy of this information
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-accessibilitySummary`}>Accessibility (public summary)</Label>
          <Textarea id={`${idPrefix}-accessibilitySummary`} rows={2} {...register("accessibilitySummary")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-parkingSummary`}>Parking (public summary)</Label>
          <Textarea id={`${idPrefix}-parkingSummary`} rows={2} {...register("parkingSummary")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-feeModelVendor`}>Vendor fees (summary for vendors)</Label>
          <Textarea id={`${idPrefix}-feeModelVendor`} rows={2} {...register("feeModelVendor")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-boothLogistics`}>Booth / load-in logistics</Label>
          <Textarea id={`${idPrefix}-boothLogistics`} rows={2} {...register("boothLogistics")} />
        </div>
      </div>
    </details>
  );
}
