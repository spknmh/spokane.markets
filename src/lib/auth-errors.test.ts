import { describe, it, expect } from "vitest";
import { getSignInErrorMessage } from "./auth-errors";

describe("getSignInErrorMessage", () => {
  it("returns email verification message for EmailNotVerified", () => {
    expect(getSignInErrorMessage("EmailNotVerified")).toContain(
      "verify your email"
    );
  });

  it("returns email verification message for lowercase emailnotverified", () => {
    expect(getSignInErrorMessage("emailnotverified")).toContain(
      "verify your email"
    );
  });

  it("returns generic message for CredentialsSignin", () => {
    expect(getSignInErrorMessage("CredentialsSignin")).toContain(
      "Invalid email or password"
    );
  });

  it("returns generic message for undefined", () => {
    expect(getSignInErrorMessage(undefined)).toContain(
      "Invalid email or password"
    );
  });
});
