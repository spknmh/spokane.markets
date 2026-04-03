/** Lightweight checklist for admin moderation — informational, not a hard gate. */

export type SubmissionCompletenessItem = {
  id: string;
  label: string;
  ok: boolean;
};

export type SubmissionCompletenessInput = {
  eventDescription: string | null;
  imageUrl: string | null;
  venueCity: string | null;
  venueState: string | null;
  venueZip: string | null;
  marketId: string | null;
  tagIds: string[];
  facebookUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
};

export function getSubmissionCompletenessChecks(input: SubmissionCompletenessInput): SubmissionCompletenessItem[] {
  const hasAddressLine = Boolean(
    input.venueCity?.trim() && input.venueState?.trim() && input.venueZip?.trim()
  );
  const hasAnyLink = Boolean(
    input.facebookUrl?.trim() || input.instagramUrl?.trim() || input.websiteUrl?.trim()
  );

  return [
    {
      id: "description",
      label: "Description",
      ok: Boolean(input.eventDescription?.trim()),
    },
    {
      id: "image",
      label: "Hero image",
      ok: Boolean(input.imageUrl?.trim()),
    },
    {
      id: "address",
      label: "City, state, ZIP",
      ok: hasAddressLine,
    },
    {
      id: "market",
      label: "Market",
      ok: input.marketId != null && input.marketId !== "",
    },
    {
      id: "tags",
      label: "At least one tag",
      ok: input.tagIds.length > 0,
    },
    {
      id: "links",
      label: "Website or social link",
      ok: hasAnyLink,
    },
  ];
}
