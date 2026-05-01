import { describe, it, expect } from "vitest";
import {
  buildAdminEventsWhere,
  buildAdminEventsExportWhere,
  resolveAdminEventsTimeScope,
} from "./events-query";

const NOW = new Date("2026-04-29T20:00:00.000Z");

describe("buildAdminEventsWhere", () => {
  it("uses active scope to hide archived and past events", () => {
    const where = buildAdminEventsWhere({ timeScope: "active", q: "", now: NOW });
    expect(where).toEqual({
      deletedAt: null,
      endDate: { gte: NOW },
    });
  });

  it("uses all_records scope to include archived and past events", () => {
    const where = buildAdminEventsWhere({ timeScope: "all_records", q: "", now: NOW });
    expect(where).not.toHaveProperty("deletedAt");
    expect(where).not.toHaveProperty("endDate");
  });

  it("uses past scope to include only non-archived past events", () => {
    const where = buildAdminEventsWhere({ timeScope: "past", q: "", now: NOW });
    expect(where.deletedAt).toBeNull();
    expect(where.endDate).toEqual({ lt: NOW });
  });

  it("applies status filter independently of time scope", () => {
    const liveDraft = buildAdminEventsWhere({
      timeScope: "active",
      q: "",
      now: NOW,
      statusFilter: "DRAFT",
    });
    expect(liveDraft.status).toBe("DRAFT");
    expect(liveDraft.deletedAt).toBeNull();
    expect(liveDraft.endDate).toEqual({ gte: NOW });

    const archivedDraft = buildAdminEventsWhere({
      timeScope: "all_records",
      q: "",
      now: NOW,
      statusFilter: "DRAFT",
    });
    expect(archivedDraft.status).toBe("DRAFT");
    expect(archivedDraft).not.toHaveProperty("deletedAt");
    expect(archivedDraft).not.toHaveProperty("endDate");
  });

  it("adds a case-insensitive OR search across title/slug/venue when q is provided", () => {
    const where = buildAdminEventsWhere({ timeScope: "active", q: "spring fair", now: NOW });
    expect(where.OR).toEqual([
      { title: { contains: "spring fair", mode: "insensitive" } },
      { slug: { contains: "spring fair", mode: "insensitive" } },
      { venue: { name: { contains: "spring fair", mode: "insensitive" } } },
    ]);
  });

  it("does not add an OR when q is empty", () => {
    const where = buildAdminEventsWhere({ timeScope: "active", q: "", now: NOW });
    expect(where).not.toHaveProperty("OR");
  });
});

describe("buildAdminEventsExportWhere", () => {
  it("matches page filter semantics for each time scope", () => {
    const live = buildAdminEventsExportWhere({ timeScope: "active", q: "", now: NOW });
    expect(live.deletedAt).toBeNull();
    expect(live.endDate).toEqual({ gte: NOW });

    const past = buildAdminEventsExportWhere({ timeScope: "past", q: "", now: NOW });
    expect(past.deletedAt).toBeNull();
    expect(past.endDate).toEqual({ lt: NOW });

    const all = buildAdminEventsExportWhere({ timeScope: "all_records", q: "", now: NOW });
    expect(all).not.toHaveProperty("deletedAt");
    expect(all).not.toHaveProperty("endDate");
  });

  it("uses a narrower OR (title/slug only, no venue join)", () => {
    const where = buildAdminEventsExportWhere({ timeScope: "active", q: "fest", now: NOW });
    expect(where.OR).toEqual([
      { title: { contains: "fest", mode: "insensitive" } },
      { slug: { contains: "fest", mode: "insensitive" } },
    ]);
  });
});

describe("resolveAdminEventsTimeScope", () => {
  it("defaults to active when no flags are set", () => {
    expect(resolveAdminEventsTimeScope({ archived: false, past: false })).toBe("active");
  });

  it("returns past when past flag is set", () => {
    expect(resolveAdminEventsTimeScope({ archived: false, past: true })).toBe("past");
  });

  it("prefers all_records when archived and past are both set", () => {
    expect(resolveAdminEventsTimeScope({ archived: true, past: true })).toBe("all_records");
  });
});
