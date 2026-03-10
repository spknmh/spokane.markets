import { describe, it, expect } from "vitest";
import { signUpSchema } from "./user";

const validInput = {
  name: "Test User",
  email: "test@example.com",
  password: "Password123!",
  confirmPassword: "Password123!",
};

describe("signUpSchema", () => {
  it("accepts valid input", () => {
    const result = signUpSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("does NOT accept a role field (SEC-1)", () => {
    const result = signUpSchema.safeParse({
      ...validInput,
      role: "ADMIN",
    });
    // Zod strips unknown fields in .parse(), so role should not survive
    if (result.success) {
      expect(result.data).not.toHaveProperty("role");
    }
  });

  it("requires name", () => {
    const result = signUpSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("requires valid email", () => {
    const result = signUpSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("requires password of at least 8 characters", () => {
    const result = signUpSchema.safeParse({
      ...validInput,
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when passwords do not match", () => {
    const result = signUpSchema.safeParse({
      ...validInput,
      confirmPassword: "DifferentPassword!",
    });
    expect(result.success).toBe(false);
  });

  it("allows empty/missing honeypot (website) field", () => {
    const result = signUpSchema.safeParse({ ...validInput, website: "" });
    expect(result.success).toBe(true);
  });

  it("allows omitted honeypot field", () => {
    const result = signUpSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects non-empty honeypot (bot detection)", () => {
    const result = signUpSchema.safeParse({
      ...validInput,
      website: "http://spam.com",
    });
    expect(result.success).toBe(false);
  });
});
