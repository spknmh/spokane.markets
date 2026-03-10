import { describe, it, expect } from "vitest";
import { isPrivilegedForMaintenance } from "./maintenance-rbac";
import type { Role } from "@prisma/client";

describe("isPrivilegedForMaintenance", () => {
  const roles: (Role | null)[] = ["ADMIN", "VENDOR", "ORGANIZER", "USER", null];

  describe("mode OFF", () => {
    it("allows everyone including anonymous", () => {
      expect(isPrivilegedForMaintenance(null, "OFF")).toBe(true);
      expect(isPrivilegedForMaintenance(undefined, "OFF")).toBe(true);
    });
    it("allows all roles", () => {
      for (const role of roles) {
        if (role) expect(isPrivilegedForMaintenance(role, "OFF")).toBe(true);
      }
    });
  });

  describe("mode MAINTENANCE_ADMIN_ONLY", () => {
    it("blocks anonymous", () => {
      expect(isPrivilegedForMaintenance(null, "MAINTENANCE_ADMIN_ONLY")).toBe(
        false
      );
    });
    it("allows only ADMIN", () => {
      expect(isPrivilegedForMaintenance("ADMIN", "MAINTENANCE_ADMIN_ONLY")).toBe(
        true
      );
    });
    it("blocks VENDOR, ORGANIZER, USER", () => {
      expect(
        isPrivilegedForMaintenance("VENDOR", "MAINTENANCE_ADMIN_ONLY")
      ).toBe(false);
      expect(
        isPrivilegedForMaintenance("ORGANIZER", "MAINTENANCE_ADMIN_ONLY")
      ).toBe(false);
      expect(
        isPrivilegedForMaintenance("USER", "MAINTENANCE_ADMIN_ONLY")
      ).toBe(false);
    });
  });

  describe("mode MAINTENANCE_PRIVILEGED", () => {
    it("blocks anonymous", () => {
      expect(
        isPrivilegedForMaintenance(null, "MAINTENANCE_PRIVILEGED")
      ).toBe(false);
    });
    it("allows ADMIN, VENDOR, ORGANIZER", () => {
      expect(
        isPrivilegedForMaintenance("ADMIN", "MAINTENANCE_PRIVILEGED")
      ).toBe(true);
      expect(
        isPrivilegedForMaintenance("VENDOR", "MAINTENANCE_PRIVILEGED")
      ).toBe(true);
      expect(
        isPrivilegedForMaintenance("ORGANIZER", "MAINTENANCE_PRIVILEGED")
      ).toBe(true);
    });
    it("blocks USER", () => {
      expect(
        isPrivilegedForMaintenance("USER", "MAINTENANCE_PRIVILEGED")
      ).toBe(false);
    });
  });
});
