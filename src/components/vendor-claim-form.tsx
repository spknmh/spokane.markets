"use client";

import { useState } from "react";
import {
  trackApiError,
  trackFormError,
  trackEvent,
} from "@/lib/analytics";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  vendorClaimRequestSchema,
  type VendorClaimRequestInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";
import { useAbandonTracking } from "@/hooks/use-abandon-tracking";

interface VendorClaimFormProps {
  vendorProfileId: string;
  vendorName: string;
}

export function VendorClaimForm({
  vendorProfileId,
  vendorName,
}: VendorClaimFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<VendorClaimRequestInput>({
    resolver: zodResolver(vendorClaimRequestSchema),
    defaultValues: { vendorProfileId, proof: "" },
  });

  useAbandonTracking({
    eventName: "vendor_verification_abandon",
    isDirty,
    isComplete: submitted,
    params: { form_id: "vendor_verification", vendor_profile_id: vendorProfileId },
  });

  async function onSubmit(data: VendorClaimRequestInput) {
    setServerError(null);
    try {
      const res = await fetch("/api/vendors/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        trackApiError("claims", res.status, { reason: "server" });
        const body = await res.json();
        throw new Error(body.error?.message ?? "Something went wrong");
      }

      trackEvent("vendor_verification_submit");
      setSubmitted(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  }

  if (submitted) {
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
        <p className="font-medium">Your claim has been submitted!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          An admin will review it shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () =>
        trackFormError("vendor_verification", "validation", {
          vendor_profile_id: vendorProfileId,
        })
      )}
      className="space-y-4"
    >
      <input type="hidden" {...register("vendorProfileId")} />

      <div className="space-y-2">
        <Label htmlFor="proof">
          Proof of ownership for {vendorName}
        </Label>
        <Textarea
          id="proof"
          rows={6}
          placeholder="Describe your relationship to this vendor. Include any evidence such as your role, website, social media, or documentation."
          {...register("proof")}
        />
        {errors.proof && (
          <p className="text-sm text-destructive">{errors.proof.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting…" : "Submit Claim"}
      </Button>
    </form>
  );
}
