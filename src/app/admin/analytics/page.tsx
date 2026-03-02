import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Calendar,
  Store,
  MapPin,
  Mail,
  MessageSquare,
  Heart,
} from "lucide-react";

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const [
    totalUsers,
    usersByRole,
    totalEvents,
    publishedEvents,
    totalMarkets,
    totalVendors,
    totalVenues,
    totalSubscribers,
    totalReviews,
    totalFavorites,
    pendingSubmissions,
    pendingClaims,
    recentUsers,
  ] = await Promise.all([
    db.user.count(),
    db.user.groupBy({
      by: ["role"],
      _count: { id: true },
    }),
    db.event.count(),
    db.event.count({ where: { status: "PUBLISHED" } }),
    db.market.count(),
    db.vendorProfile.count(),
    db.venue.count(),
    db.subscriber.count(),
    db.review.count(),
    db.favoriteVendor.count(),
    db.submission.count({ where: { status: "PENDING" } }),
    db.claimRequest.count({ where: { status: "PENDING" } }),
    db.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  const roleCounts = Object.fromEntries(
    usersByRole.map((r) => [r.role, r._count.id])
  );

  const stats = [
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
      <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
      <p className="text-muted-foreground">
        Site metrics and activity overview. For full web analytics (page views, traffic), consider adding Plausible, Vercel Analytics, or Google Analytics.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
            <p className="text-sm text-muted-foreground">
              Account distribution
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(["USER", "VENDOR", "ORGANIZER", "ADMIN"] as const).map((role) => (
                <div
                  key={role}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <span className="font-medium">{role}</span>
                  <span className="text-lg font-bold">
                    {roleCounts[role] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending</CardTitle>
            <p className="text-sm text-muted-foreground">
              Items awaiting review
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="font-medium">Submissions</span>
                <span className="text-lg font-bold">{pendingSubmissions}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="font-medium">Claims</span>
                <span className="text-lg font-bold">{pendingClaims}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sign-ups</CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest 5 users
          </p>
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
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                      {user.role}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
