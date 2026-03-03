import { db } from "@/lib/db";

/** Resolve report target to a display label and optional link. */
export async function getReportTargetInfo(
  targetType: string,
  targetId: string
): Promise<{ label: string; link: string | null }> {
  switch (targetType) {
    case "EVENT": {
      const e = await db.event.findUnique({
        where: { id: targetId },
        select: { title: true, slug: true },
      });
      return e
        ? { label: e.title, link: `/events/${e.slug}` }
        : { label: targetId, link: null };
    }
    case "MARKET": {
      const m = await db.market.findUnique({
        where: { id: targetId },
        select: { name: true, slug: true },
      });
      return m
        ? { label: m.name, link: `/markets/${m.slug}` }
        : { label: targetId, link: null };
    }
    case "VENDOR": {
      const v = await db.vendorProfile.findUnique({
        where: { id: targetId },
        select: { businessName: true, slug: true },
      });
      return v
        ? { label: v.businessName, link: `/vendors/${v.slug}` }
        : { label: targetId, link: null };
    }
    case "REVIEW":
      return { label: `Review ${targetId.slice(0, 8)}...`, link: null };
    default:
      return { label: targetId, link: null };
  }
}
