import { z } from "zod";

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

/** Magic-link sign-up: no password. Used when AUTH_USE_DATABASE_SESSIONS / magic-link-only. */
export const signUpSchemaMagicLink = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["USER", "VENDOR", "ORGANIZER"]),
  /** Honeypot — must be empty (bots fill it) */
  website: z.string().max(0).optional(),
});

export const signUpSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    /** Honeypot — must be empty (bots fill it) */
    website: z.string().max(0).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignUpInputMagicLink = z.infer<typeof signUpSchemaMagicLink>;

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
  inAppOperationalEnabled: z.boolean().optional(),
  inAppDiscoveryEnabled: z.boolean().optional(),
  inAppTrustSafetyEnabled: z.boolean().optional(),
  inAppGrowthEnabled: z.boolean().optional(),
  inAppSystemEnabled: z.boolean().optional(),
  weeklyDigestEnabled: z.boolean().optional(),
  eventMatchEnabled: z.boolean().optional(),
  favoriteVendorEnabled: z.boolean().optional(),
  organizerAlertsEnabled: z.boolean().optional(),
  vendorRequestAlertsEnabled: z.boolean().optional(),
  reviewAlertsEnabled: z.boolean().optional(),
  frequency: z.enum(["immediate", "daily", "weekly"]).optional(),
  quietHoursStart: z.number().int().min(0).max(23).nullable().optional(),
  quietHoursEnd: z.number().int().min(0).max(23).nullable().optional(),
});
export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;
