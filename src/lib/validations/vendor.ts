import { z } from "zod";
import { imageUrlSchema, flexibleUrlSchema, socialHandleSchema } from "./common";

export const vendorProfileSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  slug: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^[a-z0-9-]+$/.test(v),
      "Slug must be lowercase letters, numbers, hyphens only"
    ),
  description: z.string().optional(),
  imageUrl: imageUrlSchema,
  websiteUrl: flexibleUrlSchema,
  facebookUrl: socialHandleSchema,
  instagramUrl: socialHandleSchema,
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  galleryUrls: z
    .array(
      z
        .string()
        .refine(
          (v) => v.startsWith("/uploads/") || /^https?:\/\//.test(v),
          "Gallery images must be upload paths or http(s) URLs"
        )
    )
    .max(6, "Gallery supports up to 6 images")
    .optional(),
  /** Form-only: textarea value, one URL per line; parsed to galleryUrls on submit */
  galleryUrlsText: z.string().optional(),
  specialties: z.string().optional(),
});
export type VendorProfileInput = z.infer<typeof vendorProfileSchema>;

/** Admin-only: extends vendorProfileSchema with slug, userId, visibility flags. */
export const adminVendorProfileSchema = vendorProfileSchema.extend({
  verificationStatus: z.enum(["UNVERIFIED", "PENDING", "VERIFIED"]).optional(),
  slug: z
    .string()
    .optional()
    .refine((v) => !v || /^[a-z0-9-]+$/.test(v), "Slug must be lowercase letters, numbers, hyphens only"),
  userId: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) => v === undefined || v === null || (typeof v === "string" && v.trim().length > 0),
      "userId must be a non-empty string when provided"
    ),
  contactVisible: z.boolean().optional(),
  socialLinksVisible: z.boolean().optional(),
});
export type AdminVendorProfileInput = z.infer<typeof adminVendorProfileSchema>;

export const vendorEventsSchema = z.object({
  eventId: z.string().cuid("Invalid event ID"),
});
export type VendorEventsInput = z.infer<typeof vendorEventsSchema>;

export const vendorIntentSchema = z.object({
  status: z.enum([
    "INTERESTED",
    "APPLIED",
    "REQUESTED",
    "ATTENDING",
    "WAITLISTED",
    "DECLINED",
    "WITHDREW",
  ]),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).optional(),
  notes: z.string().max(1000).optional(),
});
export type VendorIntentInput = z.infer<typeof vendorIntentSchema>;

export const vendorSurveySchema = z.object({
  vendorType: z.string().min(1, "Vendor type is required"),
  leadTimeNeeded: z.string().optional(),
  biggestPainPoints: z.string().optional(),
  missingInfo: z.string().optional(),
  willingnessToPay: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactName: z.string().optional(),
});

export type VendorSurveyInput = z.infer<typeof vendorSurveySchema>;
