import { describe, expect, it } from "vitest";
import { getApplicationStatusForUser } from "./account-applications";

describe("getApplicationStatusForUser", () => {
  it("returns user-facing labels without admin jargon", () => {
    expect(getApplicationStatusForUser("PENDING").label).toBe("Under review");
    expect(getApplicationStatusForUser("APPROVED").label).toBe("Approved");
    expect(getApplicationStatusForUser("NEEDS_INFO").label).toBe("More information needed");
  });
});
