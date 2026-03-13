import type { VendorProfile } from "@prisma/client";
import { db } from "@/lib/db";

const VENDOR_OF_WEEK_KEY = "vendor_of_week_state";
const DEFAULT_COOLDOWN_WEEKS = 8;
const MAX_HISTORY = 52;

export type VendorOfWeek = Pick<
  VendorProfile,
  | "id"
  | "slug"
  | "businessName"
  | "description"
  | "imageUrl"
  | "specialties"
  | "websiteUrl"
  | "facebookUrl"
  | "instagramUrl"
> & {
  _count: {
    vendorEvents: number;
    favoriteVendors: number;
  };
};

type VendorOfWeekHistoryEntry = {
  weekKey: string;
  vendorId: string;
};

type VendorOfWeekState = {
  currentWeekKey: string;
  vendorId: string;
  history: VendorOfWeekHistoryEntry[];
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function vendorScore(vendor: VendorOfWeek): number {
  let score = 0;
  if (vendor.imageUrl) score += 40;
  if (vendor.description?.trim()) score += 20;
  if (vendor.specialties?.trim()) score += 20;
  score += Math.min(vendor._count.vendorEvents, 20) * 2;
  score += Math.min(vendor._count.favoriteVendors, 20) * 3;
  return score;
}

function normalizeState(raw: string | null): VendorOfWeekState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<VendorOfWeekState>;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.currentWeekKey !== "string") return null;
    if (typeof parsed.vendorId !== "string") return null;
    const history = Array.isArray(parsed.history)
      ? parsed.history.filter(
          (entry): entry is VendorOfWeekHistoryEntry =>
            !!entry &&
            typeof entry === "object" &&
            typeof (entry as { weekKey?: unknown }).weekKey === "string" &&
            typeof (entry as { vendorId?: unknown }).vendorId === "string"
        )
      : [];
    return {
      currentWeekKey: parsed.currentWeekKey,
      vendorId: parsed.vendorId,
      history,
    };
  } catch {
    return null;
  }
}

function getRecentHistory(
  history: VendorOfWeekHistoryEntry[],
  currentWeekKey: string,
  cooldownWeeks: number
): VendorOfWeekHistoryEntry[] {
  const recent: VendorOfWeekHistoryEntry[] = [];
  const currentIndex = weekKeyToIndex(currentWeekKey);
  for (const entry of history) {
    const entryIndex = weekKeyToIndex(entry.weekKey);
    if (Number.isNaN(entryIndex)) continue;
    if (currentIndex - entryIndex <= cooldownWeeks && currentIndex >= entryIndex) {
      recent.push(entry);
    }
  }
  return recent;
}

function weekKeyToIndex(weekKey: string): number {
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return Number.NaN;
  const year = Number(match[1]);
  const week = Number(match[2]);
  return year * 53 + week;
}

function sanitizeHistory(
  history: VendorOfWeekHistoryEntry[],
  currentWeekKey: string,
  selectedVendorId: string
): VendorOfWeekHistoryEntry[] {
  const next = [
    { weekKey: currentWeekKey, vendorId: selectedVendorId },
    ...history.filter((entry) => entry.weekKey !== currentWeekKey),
  ];
  return next.slice(0, MAX_HISTORY);
}

export function getWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function pickVendorOfWeekCandidate(
  vendors: VendorOfWeek[],
  currentWeekKey: string,
  history: VendorOfWeekHistoryEntry[],
  cooldownWeeks: number = DEFAULT_COOLDOWN_WEEKS
): VendorOfWeek | null {
  if (vendors.length === 0) return null;
  const recent = getRecentHistory(history, currentWeekKey, cooldownWeeks);
  const recentVendorIds = new Set(recent.map((entry) => entry.vendorId));
  const filtered = vendors.filter((vendor) => !recentVendorIds.has(vendor.id));
  const pool = filtered.length > 0 ? filtered : vendors;

  return [...pool].sort((a, b) => {
    const scoreDiff = vendorScore(b) - vendorScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    const aSeed = hashString(`${currentWeekKey}:${a.id}`);
    const bSeed = hashString(`${currentWeekKey}:${b.id}`);
    if (aSeed !== bSeed) return aSeed - bSeed;
    return a.businessName.localeCompare(b.businessName);
  })[0];
}

export async function getVendorOfWeek(): Promise<VendorOfWeek | null> {
  const weekKey = getWeekKey();
  const [stateRow, vendorPool] = await Promise.all([
    db.siteConfig.findUnique({ where: { key: VENDOR_OF_WEEK_KEY } }),
    db.vendorProfile.findMany({
      where: {
        businessName: { not: "" },
        OR: [{ imageUrl: { not: null } }, { description: { not: null } }, { specialties: { not: null } }],
      },
      select: {
        id: true,
        slug: true,
        businessName: true,
        description: true,
        imageUrl: true,
        specialties: true,
        websiteUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        _count: { select: { vendorEvents: true, favoriteVendors: true } },
      },
    }),
  ]);

  if (vendorPool.length === 0) return null;

  const state = normalizeState(stateRow?.value ?? null);
  if (state?.currentWeekKey === weekKey) {
    const existing = vendorPool.find((vendor) => vendor.id === state.vendorId);
    if (existing) return existing;
  }

  const selected = pickVendorOfWeekCandidate(vendorPool, weekKey, state?.history ?? []);
  if (!selected) return null;

  const nextHistory = sanitizeHistory(state?.history ?? [], weekKey, selected.id);
  const nextState: VendorOfWeekState = {
    currentWeekKey: weekKey,
    vendorId: selected.id,
    history: nextHistory,
  };

  await db.siteConfig.upsert({
    where: { key: VENDOR_OF_WEEK_KEY },
    update: { value: JSON.stringify(nextState) },
    create: { key: VENDOR_OF_WEEK_KEY, value: JSON.stringify(nextState) },
  });

  return selected;
}
