import { z } from "zod";

const emptyOrEnum = <T extends string>(values: readonly [T, ...T[]]) =>
  z
    .union([z.enum(values), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v));

const emptyOrEnumNull = <T extends string>(values: readonly [T, ...T[]]) =>
  z
    .union([z.enum(values), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === undefined ? undefined : v));

/** Optional organizer onboarding / compliance fields (Market defaults; Event overrides when set). */
export const organizerOnboardingFieldsSchema = z.object({
  listingKind: emptyOrEnum(["MARKET_BRAND", "EVENT_OCCURRENCE", "BOTH"] as const),
  organizerDisplayName: z.string().max(500).optional().or(z.literal("")),
  organizerPublicContact: z.coerce.boolean().optional(),
  eventType: emptyOrEnumNull([
    "FARMERS_MARKET",
    "CRAFT_FAIR",
    "NIGHT_MARKET",
    "POP_UP",
    "HOLIDAY_MARKET",
    "OTHER",
  ] as const),
  occurrenceModel: emptyOrEnumNull(["ONE_TIME", "RECURRING", "SEASONAL_SERIES"] as const),
  timezone: z.string().max(64).optional().or(z.literal("")),
  indoorOutdoor: emptyOrEnumNull(["INDOOR", "OUTDOOR", "HYBRID"] as const),
  shortDescription: z.string().max(2000).optional().or(z.literal("")),
  vendorCategoryPolicy: z.record(z.string(), z.unknown()).optional().nullable(),
  vendorApplicationState: emptyOrEnumNull([
    "NOT_ACCEPTING",
    "OPEN",
    "WAITLIST",
    "CLOSED",
  ] as const),
  vendorApplicationDeadline: z.string().max(40).optional().or(z.literal("")),
  vendorWorkflowMode: emptyOrEnumNull(["INTENT_ONLY", "BOTH"] as const),
  termsAttested: z.coerce.boolean().optional(),
  specialEventPermitStatus: emptyOrEnumNull([
    "NOT_APPLICABLE",
    "NOT_REQUIRED",
    "PENDING",
    "APPROVED",
    "UNKNOWN",
  ] as const),
  expectedAttendance: z.number().int().min(0).nullable().optional(),
  streetClosureImpact: z.boolean().optional().nullable(),
  streetClosureNarrative: z.string().max(10000).optional().or(z.literal("")),
  insuranceSummary: z.string().max(10000).optional().or(z.literal("")),
  safetyPlanSummary: z.string().max(10000).optional().or(z.literal("")),
  sanitationPlan: z.string().max(10000).optional().or(z.literal("")),
  cancellationPolicy: z.string().max(10000).optional().or(z.literal("")),
  accessibilitySummary: z.string().max(10000).optional().or(z.literal("")),
  parkingSummary: z.string().max(10000).optional().or(z.literal("")),
  restroomAccess: emptyOrEnumNull(["YES", "NO", "NEARBY", "UNKNOWN"] as const),
  petPolicy: emptyOrEnumNull(["ALLOWED", "RESTRICTED", "PROHIBITED", "UNKNOWN"] as const),
  paymentMethodsPublic: z.record(z.string(), z.unknown()).optional().nullable(),
  productHighlights: z.record(z.string(), z.unknown()).optional().nullable(),
  typicalVendorCount: z.string().max(200).optional().or(z.literal("")),
  feeModelVendor: z.string().max(10000).optional().or(z.literal("")),
  boothLogistics: z.string().max(10000).optional().or(z.literal("")),
  communicationChannels: z.string().max(2000).optional().or(z.literal("")),
  equityInclusionNotes: z.string().max(10000).optional().or(z.literal("")),
  verificationChecklist: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type OrganizerOnboardingFieldsInput = z.infer<typeof organizerOnboardingFieldsSchema>;

const ONBOARDING_KEYS = [
  "listingKind",
  "organizerDisplayName",
  "organizerPublicContact",
  "eventType",
  "occurrenceModel",
  "timezone",
  "indoorOutdoor",
  "shortDescription",
  "vendorCategoryPolicy",
  "vendorApplicationState",
  "vendorApplicationDeadline",
  "vendorWorkflowMode",
  "termsAttested",
  "specialEventPermitStatus",
  "expectedAttendance",
  "streetClosureImpact",
  "streetClosureNarrative",
  "insuranceSummary",
  "safetyPlanSummary",
  "sanitationPlan",
  "cancellationPolicy",
  "accessibilitySummary",
  "parkingSummary",
  "restroomAccess",
  "petPolicy",
  "paymentMethodsPublic",
  "productHighlights",
  "typicalVendorCount",
  "feeModelVendor",
  "boothLogistics",
  "communicationChannels",
  "equityInclusionNotes",
  "verificationChecklist",
] as const satisfies readonly (keyof OrganizerOnboardingFieldsInput)[];

/** Select fields where empty string means "unset" (HTML &lt;select&gt; placeholder). */
const ONBOARDING_ENUM_KEYS = [
  "listingKind",
  "eventType",
  "occurrenceModel",
  "indoorOutdoor",
  "vendorApplicationState",
  "vendorWorkflowMode",
  "specialEventPermitStatus",
  "restroomAccess",
  "petPolicy",
] as const satisfies readonly (keyof OrganizerOnboardingFieldsInput)[];

/** Pick onboarding subset from a merged payload (e.g. organizer event create). */
export function pickOnboardingFields(
  data: Record<string, unknown>
): OrganizerOnboardingFieldsInput {
  const slice: Record<string, unknown> = {};
  for (const k of ONBOARDING_KEYS) {
    if (k in data) slice[k] = data[k];
  }
  for (const k of ONBOARDING_ENUM_KEYS) {
    if (slice[k] === "") slice[k] = undefined;
  }
  return organizerOnboardingFieldsSchema.parse(slice);
}

/** Map validated onboarding fields to Prisma `Market` update/create data (non-null clears). */
export function toMarketOnboardingPrismaData(
  data: OrganizerOnboardingFieldsInput
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const set = <K extends string>(key: K, v: unknown) => {
    if (v !== undefined) out[key] = v;
  };
  set("listingKind", data.listingKind);
  set(
    "organizerDisplayName",
    data.organizerDisplayName === "" ? null : data.organizerDisplayName ?? undefined
  );
  if (data.organizerPublicContact !== undefined) {
    out.organizerPublicContact = data.organizerPublicContact;
  }
  set("eventType", data.eventType ?? undefined);
  set("occurrenceModel", data.occurrenceModel ?? undefined);
  set("timezone", data.timezone === "" ? null : data.timezone ?? undefined);
  set("indoorOutdoor", data.indoorOutdoor ?? undefined);
  set(
    "shortDescription",
    data.shortDescription === "" ? null : data.shortDescription ?? undefined
  );
  set("vendorCategoryPolicy", data.vendorCategoryPolicy ?? undefined);
  set("vendorApplicationState", data.vendorApplicationState ?? undefined);
  if (data.vendorApplicationDeadline !== undefined) {
    const raw = data.vendorApplicationDeadline;
    if (raw === "" || raw == null) {
      out.vendorApplicationDeadline = null;
    } else {
      const d = new Date(raw);
      out.vendorApplicationDeadline = Number.isNaN(d.getTime()) ? null : d;
    }
  }
  set("vendorWorkflowMode", data.vendorWorkflowMode ?? undefined);
  if (data.termsAttested === true) {
    out.termsAttested = true;
    out.termsAttestedAt = new Date();
  } else if (data.termsAttested === false) {
    out.termsAttested = false;
    out.termsAttestedAt = null;
  }
  set("specialEventPermitStatus", data.specialEventPermitStatus ?? undefined);
  set("expectedAttendance", data.expectedAttendance);
  if (data.streetClosureImpact !== undefined && data.streetClosureImpact !== null) {
    out.streetClosureImpact = data.streetClosureImpact;
  }
  const text = (k: keyof OrganizerOnboardingFieldsInput) => {
    const v = data[k];
    if (v === undefined) return;
    out[k as string] = v === "" ? null : v;
  };
  text("streetClosureNarrative");
  text("insuranceSummary");
  text("safetyPlanSummary");
  text("sanitationPlan");
  text("cancellationPolicy");
  text("accessibilitySummary");
  text("parkingSummary");
  set("restroomAccess", data.restroomAccess ?? undefined);
  set("petPolicy", data.petPolicy ?? undefined);
  set("paymentMethodsPublic", data.paymentMethodsPublic ?? undefined);
  set("productHighlights", data.productHighlights ?? undefined);
  text("typicalVendorCount");
  text("feeModelVendor");
  text("boothLogistics");
  text("communicationChannels");
  text("equityInclusionNotes");
  set("verificationChecklist", data.verificationChecklist ?? undefined);
  return out;
}

/** Map to Prisma `Event` update/create (nullable fields use null to clear override). */
export function toEventOnboardingPrismaData(
  data: OrganizerOnboardingFieldsInput
): Record<string, unknown> {
  return toMarketOnboardingPrismaData(data);
}

/** Map DB listing row → form defaults for onboarding fields (organizer create/edit). */
export function prismaListingToOnboardingFormDefaults(
  row: Record<string, unknown>
): Partial<OrganizerOnboardingFieldsInput> {
  const out: Partial<OrganizerOnboardingFieldsInput> = {};
  if (row.listingKind != null) {
    out.listingKind = row.listingKind as OrganizerOnboardingFieldsInput["listingKind"];
  }
  if (row.organizerDisplayName != null) {
    out.organizerDisplayName = String(row.organizerDisplayName);
  }
  if (row.organizerPublicContact === true || row.organizerPublicContact === false) {
    out.organizerPublicContact = row.organizerPublicContact;
  }
  if (row.eventType != null) {
    out.eventType = row.eventType as OrganizerOnboardingFieldsInput["eventType"];
  }
  if (row.occurrenceModel != null) {
    out.occurrenceModel = row.occurrenceModel as OrganizerOnboardingFieldsInput["occurrenceModel"];
  }
  if (row.timezone != null) {
    out.timezone = String(row.timezone);
  }
  if (row.indoorOutdoor != null) {
    out.indoorOutdoor = row.indoorOutdoor as OrganizerOnboardingFieldsInput["indoorOutdoor"];
  }
  if (row.shortDescription != null) {
    out.shortDescription = String(row.shortDescription);
  }
  if (row.vendorCategoryPolicy != null && typeof row.vendorCategoryPolicy === "object") {
    out.vendorCategoryPolicy = row.vendorCategoryPolicy as Record<string, unknown>;
  }
  if (row.vendorApplicationState != null) {
    out.vendorApplicationState =
      row.vendorApplicationState as OrganizerOnboardingFieldsInput["vendorApplicationState"];
  }
  if (row.vendorApplicationDeadline instanceof Date) {
    out.vendorApplicationDeadline = row.vendorApplicationDeadline.toISOString().slice(0, 16);
  }
  if (row.vendorWorkflowMode != null) {
    out.vendorWorkflowMode = row.vendorWorkflowMode as OrganizerOnboardingFieldsInput["vendorWorkflowMode"];
  }
  if (row.termsAttested === true || row.termsAttested === false) {
    out.termsAttested = row.termsAttested;
  }
  if (row.specialEventPermitStatus != null) {
    out.specialEventPermitStatus =
      row.specialEventPermitStatus as OrganizerOnboardingFieldsInput["specialEventPermitStatus"];
  }
  if (typeof row.expectedAttendance === "number") {
    out.expectedAttendance = row.expectedAttendance;
  }
  if (row.streetClosureImpact === true || row.streetClosureImpact === false) {
    out.streetClosureImpact = row.streetClosureImpact;
  }
  const text = (k: keyof OrganizerOnboardingFieldsInput) => {
    const v = row[k as string];
    if (v != null && typeof v === "string") {
      (out as Record<string, unknown>)[k as string] = v;
    }
  };
  text("streetClosureNarrative");
  text("insuranceSummary");
  text("safetyPlanSummary");
  text("sanitationPlan");
  text("cancellationPolicy");
  text("accessibilitySummary");
  text("parkingSummary");
  if (row.restroomAccess != null) {
    out.restroomAccess = row.restroomAccess as OrganizerOnboardingFieldsInput["restroomAccess"];
  }
  if (row.petPolicy != null) {
    out.petPolicy = row.petPolicy as OrganizerOnboardingFieldsInput["petPolicy"];
  }
  if (row.paymentMethodsPublic != null && typeof row.paymentMethodsPublic === "object") {
    out.paymentMethodsPublic = row.paymentMethodsPublic as Record<string, unknown>;
  }
  if (row.productHighlights != null && typeof row.productHighlights === "object") {
    out.productHighlights = row.productHighlights as Record<string, unknown>;
  }
  text("typicalVendorCount");
  text("feeModelVendor");
  text("boothLogistics");
  text("communicationChannels");
  text("equityInclusionNotes");
  if (row.verificationChecklist != null && typeof row.verificationChecklist === "object") {
    out.verificationChecklist = row.verificationChecklist as Record<string, unknown>;
  }
  return out;
}

/** Non-blocking hints for organizers (does not gate save). */
export function organizerOnboardingReadinessHints(
  data: Partial<OrganizerOnboardingFieldsInput>
): string[] {
  const hints: string[] = [];
  if (!String(data.shortDescription ?? "").trim()) {
    hints.push("Add a short public summary to help shoppers and vendors discover your listing.");
  }
  if (data.termsAttested !== true) {
    hints.push('Confirm marketplace terms when you are ready for verification review.');
  }
  return hints;
}
