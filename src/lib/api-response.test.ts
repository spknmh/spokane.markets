import { describe, it, expect } from "vitest";
import { apiError, apiSuccess, apiValidationError, apiNotFound } from "./api-response";

describe("apiError", () => {
  it("returns correct JSON structure with message", async () => {
    const res = apiError("Something went wrong", 500);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: { message: "Something went wrong" } });
  });

  it("includes code when provided in options", async () => {
    const res = apiError("Bad request", 400, { code: "BAD_REQUEST" });
    const body = await res.json();
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(body.error.message).toBe("Bad request");
  });

  it("includes details when provided in options", async () => {
    const details = { field: "email", reason: "invalid" };
    const res = apiError("Validation failed", 422, { code: "VALIDATION", details });
    const body = await res.json();
    expect(body.error.details).toEqual(details);
    expect(body.error.code).toBe("VALIDATION");
  });

  it("omits code and details when not provided", async () => {
    const res = apiError("Not found", 404);
    const body = await res.json();
    expect(body.error).not.toHaveProperty("code");
    expect(body.error).not.toHaveProperty("details");
  });
});

describe("apiSuccess", () => {
  it("returns data with default 200 status", async () => {
    const res = apiSuccess({ id: 1, name: "Test" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: 1, name: "Test" });
  });

  it("returns data with custom status code", async () => {
    const res = apiSuccess({ created: true }, 201);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ created: true });
  });
});

describe("apiValidationError", () => {
  it("returns 400 with fieldErrors in details", async () => {
    const fieldErrors = {
      email: ["Email is required"],
      name: ["Name is too short", "Name contains invalid characters"],
    };
    const res = apiValidationError(fieldErrors);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toBe("Validation failed");
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details.fieldErrors).toEqual(fieldErrors);
  });
});

describe("apiNotFound", () => {
  it("returns 404 with default resource message", async () => {
    const res = apiNotFound();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.message).toBe("Resource not found");
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 404 with custom resource name", async () => {
    const res = apiNotFound("Event");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.message).toBe("Event not found");
  });
});
