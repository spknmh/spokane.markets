import { db } from "@/lib/db";
import type { MaintenanceMode } from "@prisma/client";

export { isPrivilegedForMaintenance } from "./maintenance-rbac";

export interface MaintenanceState {
  mode: MaintenanceMode;
  messageTitle: string;
  messageBody: string | null;
  eta: Date | null;
  updatedAt: Date;
}

const DEFAULTS: MaintenanceState = {
  mode: "OFF",
  messageTitle: "We'll be right back",
  messageBody: null,
  eta: null,
  updatedAt: new Date(0),
};

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
    eta: row.eta,
    updatedAt: row.updatedAt,
  };
}
