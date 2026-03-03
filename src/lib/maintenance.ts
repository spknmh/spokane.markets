import { db } from "@/lib/db";
import type { MaintenanceMode } from "@prisma/client";

export { isPrivilegedForMaintenance } from "./maintenance-rbac";

export interface MaintenanceLink {
  label: string;
  url: string;
}

export interface MaintenanceState {
  mode: MaintenanceMode;
  messageTitle: string;
  messageBody: string | null;
  links: MaintenanceLink[];
  eta: Date | null;
  updatedAt: Date;
}

const DEFAULTS: MaintenanceState = {
  mode: "OFF",
  messageTitle: "We'll be right back",
  messageBody: null,
  links: [],
  eta: null,
  updatedAt: new Date(0),
};

function parseLinks(raw: unknown): MaintenanceLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (x): x is { label?: string; url?: string } =>
        x != null && typeof x === "object"
    )
    .map((x) => ({
      label: typeof x.label === "string" ? x.label.trim() : "",
      url: typeof x.url === "string" ? x.url.trim() : "",
    }))
    .filter((x) => x.label && x.url);
}

/** Returns maintenance state from DB. Used by API and server components. */
export async function getMaintenanceState(): Promise<MaintenanceState> {
  const row = await db.siteState.findUnique({
    where: { id: "default" },
  });
  if (!row) return DEFAULTS;
  return {
    mode: row.mode,
    messageTitle: row.messageTitle,
    messageBody: row.messageBody,
    links: parseLinks(row.links),
    eta: row.eta,
    updatedAt: row.updatedAt,
  };
}
