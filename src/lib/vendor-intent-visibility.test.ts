import { describe, expect, it } from "vitest";
import { resolveIntentVisibilityForCreate } from "@/lib/vendor-intent-visibility";

describe("resolveIntentVisibilityForCreate", () => {
  it("defaults attending and interested to PUBLIC", () => {
    expect(resolveIntentVisibilityForCreate("ATTENDING")).toBe("PUBLIC");
    expect(resolveIntentVisibilityForCreate("INTERESTED")).toBe("PUBLIC");
  });

  it("defaults other statuses to PRIVATE", () => {
    expect(resolveIntentVisibilityForCreate("APPLIED")).toBe("PRIVATE");
    expect(resolveIntentVisibilityForCreate("REQUESTED")).toBe("PRIVATE");
  });

  it("respects explicit visibility", () => {
    expect(resolveIntentVisibilityForCreate("INTERESTED", "PRIVATE")).toBe("PRIVATE");
    expect(resolveIntentVisibilityForCreate("INTERESTED", "PUBLIC")).toBe("PUBLIC");
  });
});
