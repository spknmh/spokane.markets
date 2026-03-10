import { z } from "zod";
import { imageUrlSchema, participationModeEnum } from "./common";

export const marketSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  venueId: z.string().min(1, "Venue is required"),
  description: z.string().optional(),
  imageUrl: imageUrlSchema,
  websiteUrl: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  baseArea: z.string().optional(),
  typicalSchedule: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  verificationStatus: z.enum(["UNVERIFIED", "PENDING", "VERIFIED"]).optional(),
  ownerId: z.string().optional().or(z.literal("")),
  participationMode: participationModeEnum.optional(),
  vendorCapacity: z.number().int().min(0).nullable().optional(),
  publicIntentListEnabled: z.boolean().optional(),
  publicIntentNamesEnabled: z.boolean().optional(),
  publicRosterEnabled: z.boolean().optional(),
});

export type MarketInput = z.infer<typeof marketSchema>;

/** Organizer-editable market fields (verified markets only). Excludes slug, venueId, verificationStatus, ownerId. */
export const organizerMarketPatchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  imageUrl: imageUrlSchema,
  websiteUrl: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  baseArea: z.string().optional(),
  typicalSchedule: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
});
export type OrganizerMarketPatchInput = z.infer<typeof organizerMarketPatchSchema>;

export const claimRequestSchema = z.object({
  marketId: z.string().min(1, "Market is required"),
  proof: z.string().min(10, "Please provide proof of your connection to this market (minimum 10 characters)"),
});
export type ClaimRequestInput = z.infer<typeof claimRequestSchema>;
