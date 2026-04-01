import { describe, expect, it } from "vitest";
import {
  organizerOnboardingFieldsSchema,
  pickOnboardingFields,
  prismaListingToOnboardingFormDefaults,
} from "./organizer-onboarding";

describe("organizerOnboardingFieldsSchema", () => {
  it("treats empty select values as undefined for enums", () => {
    const r = organizerOnboardingFieldsSchema.safeParse({
      listingKind: "",
      vendorWorkflowMode: "",
      vendorApplicationState: "",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.listingKind).toBeUndefined();
      expect(r.data.vendorWorkflowMode).toBeUndefined();
      expect(r.data.vendorApplicationState).toBeUndefined();
    }
  });
});

describe("pickOnboardingFields", () => {
  it("parses a slice of a larger payload", () => {
    const picked = pickOnboardingFields({
      title: "x",
      shortDescription: "Hello",
      termsAttested: true,
    });
    expect(picked.shortDescription).toBe("Hello");
    expect(picked.termsAttested).toBe(true);
  });
});

describe("prismaListingToOnboardingFormDefaults", () => {
  it("maps deadline to datetime-local string", () => {
    const d = new Date("2026-06-15T14:30:00.000Z");
    const out = prismaListingToOnboardingFormDefaults({
      vendorApplicationDeadline: d,
      listingKind: "BOTH",
    });
    expect(out.vendorApplicationDeadline).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(out.listingKind).toBe("BOTH");
  });
});
