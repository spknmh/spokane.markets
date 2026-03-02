import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Calendar,
  Inbox,
  MessageSquare,
  Shield,
  Mail,
  Users,
  Store,
  MapPin,
  Heart,
  Flag,
  ImageIcon,
} from "lucide-react";

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [
    totalEvents,
    publishedEvents,
    totalUsers,
    usersByRole,
    totalMarkets,
    totalVendors,
    totalVenues,
    totalSubscribers,
    totalReviews,
    totalFavorites,
    pendingSubmissions,
    pendingReviews,
    pendingClaims,
    pendingVendorClaims,
    pendingReports,
    pendingPhotos,
    recentSubmissions,
    recentReviews,
    recentUsers,
  ] = await Promise.all([
    db.event.count(),
    db.event.count({ where: { status: "PUBLISHED" } }),
    db.user.count(),
    db.user.groupBy({ by: ["role"], _count: { id: true } }),
    db.market.count(),
    db.vendorProfile.count(),
    db.venue.count(),
    db.subscriber.count(),
    db.review.count(),
    db.favoriteVendor.count(),
    db.submission.count({ where: { status: "PENDING" } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.claimRequest.count({ where: { status: "PENDING" } }),
    db.vendorClaimRequest.count({ where: { status: "PENDING" } }),
    db.report.count({ where: { status: "PENDING" } }),
    db.photo.count({ where: { status: "PENDING" } }),
    db.submission.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    db.review.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    db.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  const roleCounts = Object.fromEntries(
    usersByRole.map((r) => [r.role, r._count.id])
  );

  const queueStats = [
    { label: "Pending Submissions", value: pendingSubmissions, icon: Inbox, href: "/admin/submissions?status=PENDING" },
    { label: "Pending Reviews", value: pendingReviews, icon: MessageSquare, href: "/admin/reviews?status=PENDING" },
    { label: "Pending Photos", value: pendingPhotos, icon: ImageIcon, href: "/admin/photos?status=PENDING" },
    { label: "Pending Market Claims", value: pendingClaims, icon: Shield, href: "/admin/claims?tab=market&status=PENDING" },
    { label: "Pending Vendor Claims", value: pendingVendorClaims, icon: Shield, href: "/admin/claims?tab=vendor&status=PENDING" },
    { label: "Pending Reports", value: pendingReports, icon: Flag, href: "/admin/reports?status=PENDING" },
  ];

  const metricStats = [
    { label: "Total Users", value: totalUsers, icon: Users },
    { label: "Published Events", value: publishedEvents, sub: `of ${totalEvents}`, icon: Calendar },
    { label: "Markets", value: totalMarkets, icon: Store },
    { label: "Vendors", value: totalVendors, icon: Store },
    { label: "Venues", value: totalVenues, icon: MapPin },
    { label: "Subscribers", value: totalSubscribers, icon: Mail },
    { label: "Reviews", value: totalReviews, icon: MessageSquare },
    { label: "Favorites", value: totalFavorites, icon: Heart },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
      <p className="text-muted-foreground">
        Site metrics and operational queues. For full web analytics (page views, traffic), consider adding Plausible, Vercel Analytics, or Google Analytics.
      </p>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Queues</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {queueStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Metrics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.sub && (
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Users by Role</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(["USER", "VENDOR", "ORGANIZER", "ADMIN"] as const).map((role) => (
                <div
                  key={role}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <span className="font-medium">{role}</span>
                  <span className="text-lg font-bold">{roleCounts[role] ?? 0}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium">{sub.eventTitle}</p>
                      <p className="text-muted-foreground">by {sub.submitterName}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(sub.createdAt)}
                    </span>
                  </div>
                ))}
                <Link href="/admin/submissions" className="text-sm text-primary hover:underline">
                  View all →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {recentReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {recentReviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </p>
                      <p className="text-muted-foreground">
                        by {review.user.name || review.user.email}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                ))}
                <Link href="/admin/reviews" className="text-sm text-primary hover:underline">
                  View all →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sign-ups</CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{user.name ?? "—"}</p>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                        {user.role}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                <Link href="/admin/users" className="text-sm text-primary hover:underline">
                  View all →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
