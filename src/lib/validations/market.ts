import { z } from "zod";
import { MAX_LISTING_COMMUNITY_BADGES } from "@/lib/listing-community-badges";
import {
  imageUrlSchema,
  neighborhoodSlugSchema,
  participationModeEnum,
  imageFocalSchema,
} from "./common";
import { organizerOnboardingFieldsSchema } from "./organizer-onboarding";

export const marketSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    venueId: z.string().min(1, "Venue is required"),
    description: z.string().optional(),
    imageUrl: imageUrlSchema,
    imageFocalX: imageFocalSchema,
    imageFocalY: imageFocalSchema,
    websiteUrl: z.string().url().optional().or(z.literal("")),
    facebookUrl: z.string().url().optional().or(z.literal("")),
    instagramUrl: z.string().url().optional().or(z.literal("")),
    baseArea: neighborhoodSlugSchema.optional(),
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
    listingCommunityBadgeIds: z
      .array(z.string().min(1))
      .max(
        MAX_LISTING_COMMUNITY_BADGES,
        `Select at most ${MAX_LISTING_COMMUNITY_BADGES} community badges`
      )
      .optional(),
    complianceFlagged: z.boolean().optional(),
    complianceNotes: z.string().max(10000).optional().or(z.literal("")),
  })
  .merge(organizerOnboardingFieldsSchema);

export type MarketInput = z.infer<typeof marketSchema>;

/** Organizer-editable market fields (verified markets only). Excludes slug, venueId, verificationStatus, ownerId. */
export const organizerMarketPatchSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    imageUrl: imageUrlSchema,
    imageFocalX: imageFocalSchema,
    imageFocalY: imageFocalSchema,
    websiteUrl: z.string().url().optional().or(z.literal("")),
    facebookUrl: z.string().url().optional().or(z.literal("")),
    instagramUrl: z.string().url().optional().or(z.literal("")),
    baseArea: neighborhoodSlugSchema.optional(),
    typicalSchedule: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal("")),
    contactPhone: z.string().optional(),
    listingCommunityBadgeIds: z
      .array(z.string().min(1))
      .max(
        MAX_LISTING_COMMUNITY_BADGES,
        `Select at most ${MAX_LISTING_COMMUNITY_BADGES} community badges`
      )
      .optional(),
  })
  .merge(organizerOnboardingFieldsSchema);
export type OrganizerMarketPatchInput = z.infer<typeof organizerMarketPatchSchema>;

export const organizerMarketCreateSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    venueId: z.string().min(1, "Venue is required"),
    description: z.string().optional(),
    imageUrl: imageUrlSchema,
    imageFocalX: imageFocalSchema,
    imageFocalY: imageFocalSchema,
    websiteUrl: z.string().url().optional().or(z.literal("")),
    facebookUrl: z.string().url().optional().or(z.literal("")),
    instagramUrl: z.string().url().optional().or(z.literal("")),
    baseArea: neighborhoodSlugSchema.optional(),
    typicalSchedule: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal("")),
    contactPhone: z.string().optional(),
    participationMode: participationModeEnum.optional(),
    vendorCapacity: z.number().int().min(0).nullable().optional(),
    publicIntentListEnabled: z.boolean().optional(),
    publicIntentNamesEnabled: z.boolean().optional(),
    publicRosterEnabled: z.boolean().optional(),
    listingCommunityBadgeIds: z
      .array(z.string().min(1))
      .max(
        MAX_LISTING_COMMUNITY_BADGES,
        `Select at most ${MAX_LISTING_COMMUNITY_BADGES} community badges`
      )
      .optional(),
  })
  .merge(organizerOnboardingFieldsSchema);
export type OrganizerMarketCreateInput = z.infer<typeof organizerMarketCreateSchema>;

