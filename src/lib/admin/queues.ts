import { db } from "@/lib/db";
import { getReportTargetInfo } from "@/lib/report-target";

export type QueueType =
  | "submission"
  | "review"
  | "photo"
  | "market_claim"
  | "vendor_claim"
  | "report";

export type QueueItem = {
  type: QueueType;
  id: string;
  createdAt: Date;
  title: string;
  subtitle?: string;
  status: "pending" | "needs_review";
  href: string;
  scope?: { marketId?: string; eventId?: string; vendorId?: string };
  imageUrl?: string;
};

export type QueueSummary = {
  type: QueueType;
  count: number;
  oldestAt: Date | null;
};

const LIMIT_PER_TYPE = 50;
const LIMIT_ALL = 50;

export async function getQueuesSummary(): Promise<QueueSummary[]> {
  const [
    submissions,
    reviews,
    photos,
    marketClaims,
    vendorClaims,
    reports,
  ] = await Promise.all([
    db.submission.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 1,
      select: { createdAt: true },
    }),
    db.review.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 1,
      select: { createdAt: true },
    }),
    db.photo.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 1,
      select: { createdAt: true },
    }),
    db.claimRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 1,
      select: { createdAt: true },
    }),
    db.vendorClaimRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 1,
      select: { createdAt: true },
    }),
    db.report.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 1,
      select: { createdAt: true },
    }),
  ]);

  const [subCount, revCount, photoCount, mClaimCount, vClaimCount, reportCount] =
    await Promise.all([
      db.submission.count({ where: { status: "PENDING" } }),
      db.review.count({ where: { status: "PENDING" } }),
      db.photo.count({ where: { status: "PENDING" } }),
      db.claimRequest.count({ where: { status: "PENDING" } }),
      db.vendorClaimRequest.count({ where: { status: "PENDING" } }),
      db.report.count({ where: { status: "PENDING" } }),
    ]);

  return [
    {
      type: "submission",
      count: subCount,
      oldestAt: submissions[0]?.createdAt ?? null,
    },
    {
      type: "review",
      count: revCount,
      oldestAt: reviews[0]?.createdAt ?? null,
    },
    {
      type: "photo",
      count: photoCount,
      oldestAt: photos[0]?.createdAt ?? null,
    },
    {
      type: "market_claim",
      count: mClaimCount,
      oldestAt: marketClaims[0]?.createdAt ?? null,
    },
    {
      type: "vendor_claim",
      count: vClaimCount,
      oldestAt: vendorClaims[0]?.createdAt ?? null,
    },
    {
      type: "report",
      count: reportCount,
      oldestAt: reports[0]?.createdAt ?? null,
    },
  ];
}

export async function getQueueItems(opts: {
  type?: QueueType | "all";
  limit?: number;
  sort?: "oldest" | "newest";
}): Promise<QueueItem[]> {
  const { type = "all", limit = LIMIT_ALL, sort = "oldest" } = opts;
  const orderBy = sort === "oldest" ? "asc" : "desc";
  const take = type === "all" ? limit : Math.min(limit, LIMIT_PER_TYPE);

  if (type === "all") {
    const [subs, revs, photos, mClaims, vClaims, reports] = await Promise.all([
      db.submission.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: orderBy },
        take: Math.ceil(take / 6),
        select: {
          id: true,
          createdAt: true,
          eventTitle: true,
          submitterName: true,
        },
      }),
      db.review.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: orderBy },
        take: Math.ceil(take / 6),
        include: {
          user: { select: { name: true, email: true } },
          event: { select: { title: true } },
          market: { select: { name: true } },
        },
      }),
      db.photo.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: orderBy },
        take: Math.ceil(take / 6),
        include: {
          uploadedBy: { select: { name: true, email: true } },
          event: { select: { title: true } },
          market: { select: { name: true } },
        },
      }),
      db.claimRequest.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: orderBy },
        take: Math.ceil(take / 6),
        include: {
          market: { select: { name: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      db.vendorClaimRequest.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: orderBy },
        take: Math.ceil(take / 6),
        include: {
          vendorProfile: { select: { businessName: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      db.report.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: orderBy },
        take: Math.ceil(take / 6),
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    const reportLabels = await Promise.all(
      reports.map((r) => getReportTargetInfo(r.targetType, r.targetId))
    );

    const items: QueueItem[] = [
      ...subs.map((s) => ({
        type: "submission" as const,
        id: s.id,
        createdAt: s.createdAt,
        title: s.eventTitle,
        subtitle: `by ${s.submitterName}`,
        status: "pending" as const,
        href: "/admin/submissions?status=PENDING",
      })),
      ...revs.map((r) => ({
        type: "review" as const,
        id: r.id,
        createdAt: r.createdAt,
        title: r.event ? r.event.title : r.market ? r.market.name : "Review",
        subtitle: `by ${r.user.name ?? r.user.email}`,
        status: "pending" as const,
        href: "/admin/reviews?status=PENDING",
      })),
      ...photos.map((p) => ({
        type: "photo" as const,
        id: p.id,
        createdAt: p.createdAt,
        title: p.event ? p.event.title : p.market ? p.market.name : "Photo",
        subtitle: `by ${p.uploadedBy.name ?? p.uploadedBy.email}`,
        status: "pending" as const,
        href: "/admin/photos?status=PENDING",
        imageUrl: p.url,
      })),
      ...mClaims.map((c) => ({
        type: "market_claim" as const,
        id: c.id,
        createdAt: c.createdAt,
        title: c.market.name,
        subtitle: `by ${c.user.name ?? c.user.email}`,
        status: "pending" as const,
        href: "/admin/claims?tab=market&status=PENDING",
      })),
      ...vClaims.map((c) => ({
        type: "vendor_claim" as const,
        id: c.id,
        createdAt: c.createdAt,
        title: c.vendorProfile.businessName,
        subtitle: `by ${c.user.name ?? c.user.email}`,
        status: "pending" as const,
        href: "/admin/claims?tab=vendor&status=PENDING",
      })),
      ...reports.map((r, i) => ({
        type: "report" as const,
        id: r.id,
        createdAt: r.createdAt,
        title: `${r.targetType}: ${reportLabels[i]?.label ?? r.targetId}`,
        subtitle: `by ${r.user.name ?? r.user.email}`,
        status: "pending" as const,
        href: "/admin/reports?status=PENDING",
      })),
    ];

    items.sort(
      (a, b) =>
        (orderBy === "asc" ? 1 : -1) *
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    );
    return items.slice(0, take);
  }

  switch (type) {
    case "submission": {
      const subs = await db.submission.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: orderBy },
        take,
        select: {
          id: true,
          createdAt: true,
          eventTitle: true,
          submitterName: true,
        },
      });
      return subs.map((s) => ({
        type: "submission" as const,
        id: s.id,
        createdAt: s.createdAt,
        title: s.eventTitle,
        subtitle: `by ${s.submitterName}`,
        status: "pending" as const,
        href: "/admin/submissions?status=PENDING",
      }));
    }
    case "review": {
      const revs = await db.review.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: orderBy },
        take,
        include: {
          user: { select: { name: true, email: true } },
          event: { select: { title: true } },
          market: { select: { name: true } },
        },
      });
      return revs.map((r) => ({
        type: "review" as const,
        id: r.id,
        createdAt: r.createdAt,
        title: r.event ? r.event.title : r.market ? r.market.name : "Review",
        subtitle: `by ${r.user.name ?? r.user.email}`,
        status: "pending" as const,
        href: "/admin/reviews?status=PENDING",
      }));
    }
    case "photo": {
      const photos = await db.photo.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: orderBy },
        take,
        include: {
          uploadedBy: { select: { name: true, email: true } },
          event: { select: { title: true } },
          market: { select: { name: true } },
        },
      });
      return photos.map((p) => ({
        type: "photo" as const,
        id: p.id,
        createdAt: p.createdAt,
        title: p.event ? p.event.title : p.market ? p.market.name : "Photo",
        subtitle: `by ${p.uploadedBy.name ?? p.uploadedBy.email}`,
        status: "pending" as const,
        href: "/admin/photos?status=PENDING",
        imageUrl: p.url,
      }));
    }
    case "market_claim": {
      const claims = await db.claimRequest.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: orderBy },
        take,
        include: {
          market: { select: { name: true } },
          user: { select: { name: true, email: true } },
        },
      });
      return claims.map((c) => ({
        type: "market_claim" as const,
        id: c.id,
        createdAt: c.createdAt,
        title: c.market.name,
        subtitle: `by ${c.user.name ?? c.user.email}`,
        status: "pending" as const,
        href: "/admin/claims?tab=market&status=PENDING",
      }));
    }
    case "vendor_claim": {
      const claims = await db.vendorClaimRequest.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: orderBy },
        take,
        include: {
          vendorProfile: { select: { businessName: true } },
          user: { select: { name: true, email: true } },
        },
      });
      return claims.map((c) => ({
        type: "vendor_claim" as const,
        id: c.id,
        createdAt: c.createdAt,
        title: c.vendorProfile.businessName,
        subtitle: `by ${c.user.name ?? c.user.email}`,
        status: "pending" as const,
        href: "/admin/claims?tab=vendor&status=PENDING",
      }));
    }
    case "report": {
      const reports = await db.report.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: orderBy },
        take,
        include: { user: { select: { name: true, email: true } } },
      });
      const labels = await Promise.all(
        reports.map((r) => getReportTargetInfo(r.targetType, r.targetId))
      );
      return reports.map((r, i) => ({
        type: "report" as const,
        id: r.id,
        createdAt: r.createdAt,
        title: `${r.targetType}: ${labels[i]?.label ?? r.targetId}`,
        subtitle: `by ${r.user.name ?? r.user.email}`,
        status: "pending" as const,
        href: "/admin/reports?status=PENDING",
      }));
    }
    default:
      return [];
  }
}
