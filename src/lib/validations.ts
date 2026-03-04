import { z } from "zod";

export const submissionSchema = z.object({
  submitterName: z.string().min(1, "Name is required"),
  submitterEmail: z.string().email("Valid email is required"),
  eventTitle: z.string().min(1, "Event title is required"),
  eventDescription: z.string().optional(),
  eventDate: z.string().min(1, "Event date is required"),
  eventTime: z.string().min(1, "Event time is required"),
  venueName: z.string().min(1, "Venue name is required"),
  venueAddress: z.string().min(1, "Venue address is required"),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  /** Honeypot */
  company: z.string().max(0).optional(),
});

/** Schema for authenticated submissions (submitter from session) */
export const submissionSchemaAuthed = submissionSchema.omit({
  submitterName: true,
  submitterEmail: true,
});

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

export const venueSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(5, "ZIP code is required"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  neighborhood: z.string().optional(),
  parkingNotes: z.string().optional(),
});

export type VenueInput = z.infer<typeof venueSchema>;

export const marketSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  venueId: z.string().min(1, "Venue is required"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  baseArea: z.string().optional(),
  typicalSchedule: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  verificationStatus: z.enum(["UNVERIFIED", "PENDING", "VERIFIED"]).optional(),
  ownerId: z.string().optional().or(z.literal("")),
});

export type MarketInput = z.infer<typeof marketSchema>;

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  timezone: z.string().optional().nullable(),
  venueId: z.string().min(1, "Venue is required"),
  marketId: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PENDING", "PUBLISHED", "CANCELLED"]),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  tagIds: z.array(z.string()).optional(),
  featureIds: z.array(z.string()).optional(),
});

export type EventInput = z.infer<typeof eventSchema>;

export const signInSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const SIGNUP_ROLES = [
  {
    value: "USER",
    label: "Consumer",
    description: "Find events, save filters, mark Going/Interested, favorite vendors, and get email alerts when new events match your interests.",
  },
  {
    value: "VENDOR",
    label: "Vendor",
    description: "Create a vendor profile, list where you'll be selling, connect with customers who favorite you, and get discovered at markets.",
  },
  {
    value: "ORGANIZER",
    label: "Organizer / Market Owner",
    description: "Submit and manage events for your market, get verified, and reach visitors planning their weekend.",
  },
] as const;

export const signUpSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["USER", "VENDOR", "ORGANIZER"]),
    /** Honeypot — must be empty (bots fill it) */
    website: z.string().max(0).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

export const adminCreateUserSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["USER", "VENDOR", "ORGANIZER", "ADMIN"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;

// ─── Milestone 2 schemas ────────────────────────────────────────────

export const attendanceSchema = z.object({
  eventId: z.string().min(1),
  status: z.enum(["GOING", "INTERESTED"]),
});
export type AttendanceInput = z.infer<typeof attendanceSchema>;

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

export const claimRequestSchema = z.object({
  marketId: z.string().min(1, "Market is required"),
  proof: z.string().min(10, "Please provide proof of your connection to this market (minimum 10 characters)"),
});
export type ClaimRequestInput = z.infer<typeof claimRequestSchema>;

export const vendorClaimRequestSchema = z.object({
  vendorProfileId: z.string().min(1),
  proof: z.string().min(10, "Proof required"),
});
export type VendorClaimRequestInput = z.infer<typeof vendorClaimRequestSchema>;

// ─── Milestone 3 schemas ────────────────────────────────────────────

export const vendorProfileSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  galleryUrls: z.array(z.string().url()).optional(),
  /** Form-only: textarea value, one URL per line; parsed to galleryUrls on submit */
  galleryUrlsText: z.string().optional(),
  specialties: z.string().optional(),
});
export type VendorProfileInput = z.infer<typeof vendorProfileSchema>;

export const savedFilterSchema = z.object({
  name: z.string().min(1, "Filter name is required"),
  dateRange: z.string().optional(),
  neighborhoods: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  emailAlerts: z.boolean().optional(),
});
export type SavedFilterInput = z.infer<typeof savedFilterSchema>;

export const notificationPreferenceSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  weeklyDigestEnabled: z.boolean().optional(),
  eventMatchEnabled: z.boolean().optional(),
  favoriteVendorEnabled: z.boolean().optional(),
  organizerAlertsEnabled: z.boolean().optional(),
  frequency: z.enum(["immediate", "daily", "weekly"]).optional(),
  quietHoursStart: z.number().int().min(0).max(23).nullable().optional(),
  quietHoursEnd: z.number().int().min(0).max(23).nullable().optional(),
});
export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;

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

export const reportSchema = z.object({
  targetType: z.enum(["EVENT", "MARKET", "VENDOR", "REVIEW"]),
  targetId: z.string().min(1, "Target ID is required"),
  reason: z.enum(["spam", "inappropriate", "other"]).optional(),
  notes: z.string().max(500).optional(),
});
export type ReportInput = z.infer<typeof reportSchema>;

export const userProfilePatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z
    .union([
      z
        .string()
        .refine(
          (v) => v.startsWith("/uploads/") || /^https?:\/\//.test(v),
          "Invalid image URL"
        ),
      z.null(),
    ])
    .optional(),
});
export type UserProfilePatchInput = z.infer<typeof userProfilePatchSchema>;

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

export const promotionSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  type: z.enum(["SPONSORED", "PARTNERSHIP", "FEATURED"]),
  sponsorName: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  linkUrl: z.string().url().optional().or(z.literal("")),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  sortOrder: z.number().int().min(0).optional(),
});
export type PromotionInput = z.infer<typeof promotionSchema>;

export const promotionPatchSchema = promotionSchema.partial();
export type PromotionPatchInput = z.infer<typeof promotionPatchSchema>;

export const organizerEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  timezone: z.string().optional().nullable(),
  venueId: z.string().min(1, "Venue is required"),
  marketId: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  tagIds: z.array(z.string()).optional(),
  featureIds: z.array(z.string()).optional(),
});
export type OrganizerEventInput = z.infer<typeof organizerEventSchema>;
