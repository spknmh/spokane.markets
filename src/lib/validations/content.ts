import { z } from "zod";
import { imageUrlSchema } from "./common";

const submissionSchemaBase = z.object({
  submitterName: z.string().min(1, "Name is required"),
  submitterEmail: z.string().email("Valid email is required"),
  eventTitle: z.string().min(1, "Event title is required"),
  eventDescription: z.string().optional(),
  eventDate: z.string().min(1, "Event date is required"),
  eventTime: z.string().optional(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  allDay: z.boolean().default(false),
  timezone: z.string().optional().or(z.literal("")),
  imageUrl: imageUrlSchema.optional().or(z.literal("")),
  venueName: z.string().min(1, "Venue name is required"),
  venueAddress: z.string().min(1, "Venue address is required"),
  venueCity: z.string().optional().or(z.literal("")),
  venueState: z.string().optional().or(z.literal("")),
  venueZip: z.string().optional().or(z.literal("")),
  marketId: z.string().optional().or(z.literal("")),
  tagIds: z.array(z.string()).optional().default([]),
  featureIds: z.array(z.string()).optional().default([]),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  /** Honeypot */
  company: z.string().max(0).optional(),
});

const submissionTimeRefine = (
  data: { allDay?: boolean; eventTime?: string } &
    Record<string, unknown>
) =>
  data.allDay === true ||
  (typeof data.eventTime === "string" && data.eventTime.trim().length > 0);

export const submissionSchema = submissionSchemaBase.refine(
  submissionTimeRefine,
  { message: "Event time is required when not all day", path: ["eventTime"] }
);

/** Schema for authenticated submissions (submitter from session) */
export const submissionSchemaAuthed = submissionSchemaBase
  .omit({ submitterName: true, submitterEmail: true })
  .refine(
    submissionTimeRefine,
    { message: "Event time is required when not all day", path: ["eventTime"] }
  );

export type SubmissionInput = z.infer<typeof submissionSchema>;
export type SubmissionInputAuthed = z.infer<typeof submissionSchemaAuthed>;

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  /** Honeypot */
  company: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const subscriberSchema = z.object({
  email: z.string().email("Valid email is required"),
  areas: z.array(z.string()).optional(),
  /** Honeypot */
  company: z.string().max(0).optional(),
});

export type SubscriberInput = z.infer<typeof subscriberSchema>;

export const reviewSchema = z.object({
  eventId: z.string().optional(),
  marketId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000, "Review must be 2000 characters or less").optional(),
  parkingRating: z.number().int().min(1).max(5).optional(),
  varietyRating: z.number().int().min(1).max(5).optional(),
  valueRating: z.number().int().min(1).max(5).optional(),
  crowdingRating: z.number().int().min(1).max(5).optional(),
  weatherPlanRating: z.number().int().min(1).max(5).optional(),
  accessibilityRating: z.number().int().min(1).max(5).optional(),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

export const reportSchema = z.object({
  targetType: z.enum(["EVENT", "MARKET", "VENDOR", "REVIEW"]),
  targetId: z.string().min(1, "Target ID is required"),
  reason: z.enum(["spam", "inappropriate", "other"]).optional(),
  notes: z.string().max(500).optional(),
});
export type ReportInput = z.infer<typeof reportSchema>;

export const promotionSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  type: z.enum(["SPONSORED", "PARTNERSHIP", "FEATURED"]),
  sponsorName: z.string().optional().nullable(),
  imageUrl: imageUrlSchema,
  linkUrl: z.string().url().optional().or(z.literal("")),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  sortOrder: z.number().int().min(0).optional(),
});
export type PromotionInput = z.infer<typeof promotionSchema>;

export const promotionPatchSchema = promotionSchema.partial();
export type PromotionPatchInput = z.infer<typeof promotionPatchSchema>;
