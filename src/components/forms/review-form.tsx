"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema, type ReviewInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/forms/star-rating";
import Image from "next/image";
import { ImagePlus, X, Loader2 } from "lucide-react";
import {
  imageUploadReviewAddButtonClassName,
  imageUploadReviewPreviewClassName,
} from "@/components/image-upload/constants";
import { cn } from "@/lib/utils";
import { FormErrorBanner } from "@/components/ui/form-error-banner";

interface ReviewFormProps {
  eventId?: string;
  marketId?: string;
  onSuccess?: () => void;
}

const STRUCTURED_PROMPTS = [
  { key: "parkingRating" as const, label: "Parking" },
  { key: "varietyRating" as const, label: "Vendor Variety" },
  { key: "valueRating" as const, label: "Price / Value" },
  { key: "crowdingRating" as const, label: "Crowding" },
  { key: "weatherPlanRating" as const, label: "Weather Plan" },
  { key: "accessibilityRating" as const, label: "Accessibility" },
];

interface PhotoPreview {
  file: File;
  previewUrl: string;
}

export function ReviewForm({ eventId, marketId, onSuccess }: ReviewFormProps) {
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      eventId: eventId ?? undefined,
      marketId: marketId ?? undefined,
      rating: 0,
      text: "",
    },
  });

  const ratingValue = watch("rating");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newPreviews = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function onSubmit(data: ReviewInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      const photoIds: string[] = [];

      for (const photo of photos) {
        const formData = new FormData();
        formData.append("file", photo.file);
        if (eventId) formData.append("eventId", eventId);
        if (marketId) formData.append("marketId", marketId);

        const uploadRes = await fetch("/api/photos/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload photo");
        }

        const uploadedPhoto = await uploadRes.json();
        photoIds.push(uploadedPhoto.id);
      }

      const reviewRes = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          rating: Number(data.rating),
        }),
      });

      if (!reviewRes.ok) {
        const errBody = await reviewRes.json();
        throw new Error(errBody.error ?? "Failed to submit review");
      }

      const review = await reviewRes.json();

      if (photoIds.length > 0) {
        await Promise.all(
          photoIds.map((photoId) =>
            fetch("/api/photos/upload", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ photoId, reviewId: review.id }),
            }).catch(() => {})
          )
        );
      }

      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <p className="text-lg font-semibold text-green-600">Review submitted!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          It will be visible after moderation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
      {/* Overall Rating */}
      <div role="radiogroup" aria-label="Overall rating" className="space-y-2">
        <Label>Overall Rating *</Label>
        <StarRating
          value={ratingValue}
          onChange={(val) => setValue("rating", val, { shouldValidate: true })}
        />
        {errors.rating && (
          <p className="text-sm text-destructive">{errors.rating.message}</p>
        )}
      </div>

      {/* Text Review */}
      <div className="space-y-2">
        <Label htmlFor="review-text">Your Review</Label>
        <Textarea
          id="review-text"
          placeholder="Tell others about your experience..."
          rows={4}
          maxLength={2000}
          {...register("text")}
        />
        <p className="text-right text-xs text-muted-foreground">
          {watch("text")?.length ?? 0} / 2000
        </p>
      </div>

      {/* Structured Prompts */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">
          Optional Ratings
        </Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {STRUCTURED_PROMPTS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-2 rounded-md border p-2">
              <span className="text-sm">{label}</span>
              <StarRating
                value={watch(key) ?? 0}
                onChange={(val) => setValue(key, val)}
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Photo Upload */}
      <div className="space-y-2">
        <Label>Photos</Label>
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, index) => (
            <div key={index} className={imageUploadReviewPreviewClassName}>
              <Image
                src={photo.previewUrl}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
                sizes="112px"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(imageUploadReviewAddButtonClassName, "gap-1")}
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">Add</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <FormErrorBanner message={error} />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Review"
        )}
      </Button>
    </form>
  );
}
