import { z } from "zod";

export const tagSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
});
export type TagInput = z.infer<typeof tagSchema>;

export const featureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  icon: z.string().optional().or(z.literal("")),
});
export type FeatureInput = z.infer<typeof featureSchema>;

export const venueSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(5, "ZIP code is required"),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  neighborhood: z.string().optional(),
  parkingNotes: z.string().optional(),
});

export type VenueInput = z.infer<typeof venueSchema>;
