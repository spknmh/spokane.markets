import { describe, expect, it } from "vitest";
import { submissionSchema, submissionSchemaAuthed } from "./content";

describe("submissionSchema", () => {
  const base = {
    submitterName: "Jane",
    submitterEmail: "jane@example.com",
    eventTitle: "Spring Market",
    eventDate: "2026-06-01",
    eventTime: "10:00",
    allDay: false,
    venueName: "Hall",
    venueAddress: "123 Main St",
    venueCity: "Spokane",
    venueState: "WA",
    venueZip: "99201",
    company: "",
  };

  it("requires city, state, and ZIP", () => {
    const parsed = submissionSchema.safeParse({
      ...base,
      venueCity: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid venue address fields", () => {
    const parsed = submissionSchema.safeParse(base);
    expect(parsed.success).toBe(true);
  });
});

describe("submissionSchemaAuthed", () => {
  it("requires venue city, state, zip without submitter fields", () => {
    const parsed = submissionSchemaAuthed.safeParse({
      eventTitle: "Spring Market",
      eventDate: "2026-06-01",
      eventTime: "10:00",
      allDay: false,
      venueName: "Hall",
      venueAddress: "123 Main St",
      venueCity: "Spokane",
      venueState: "WA",
      venueZip: "99201",
      company: "",
    });
    expect(parsed.success).toBe(true);
  });
});
