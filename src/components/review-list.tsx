import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface ReviewListProps {
  eventId?: string;
  marketId?: string;
}

const STRUCTURED_LABELS: Record<string, string> = {
  parkingRating: "Parking",
  varietyRating: "Variety",
  valueRating: "Value",
  crowdingRating: "Crowding",
  weatherPlanRating: "Weather Plan",
  accessibilityRating: "Accessibility",
};

function InlineStars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${
            s <= value
              ? "fill-yellow-400 text-yellow-400"
              : "fill-none text-muted-foreground/30"
          }`}
        />
      ))}
    </span>
  );
}

export async function ReviewList({ eventId, marketId }: ReviewListProps) {
  const reviews = await db.review.findMany({
    where: {
      status: "APPROVED",
      ...(eventId ? { eventId } : {}),
      ...(marketId ? { marketId } : {}),
    },
    include: {
      user: { select: { name: true, image: true } },
      photos: { where: { status: "APPROVED" } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (reviews.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No reviews yet. Be the first to share your experience!
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => {
        const structuredRatings = Object.entries(STRUCTURED_LABELS)
          .filter(([key]) => (review as Record<string, unknown>)[key] != null)
          .map(([key, label]) => ({
            label,
            value: (review as Record<string, unknown>)[key] as number,
          }));

        return (
          <div key={review.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {review.user.name ?? "Anonymous"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <InlineStars value={review.rating} />
            </div>

            {review.text && (
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                {review.text}
              </p>
            )}

            {structuredRatings.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {structuredRatings.map(({ label, value }) => (
                  <Badge key={label} variant="secondary" className="gap-1 text-xs">
                    {label}: {value}/5
                  </Badge>
                ))}
              </div>
            )}

            {review.photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {review.photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.url}
                    alt={photo.alt ?? "Review photo"}
                    className="h-20 w-20 rounded-md object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
