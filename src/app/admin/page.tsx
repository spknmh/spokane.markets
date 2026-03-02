import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Calendar, Inbox, MessageSquare, Shield, Mail } from "lucide-react";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [
    totalEvents,
    pendingSubmissions,
    pendingReviews,
    pendingClaims,
    totalSubscribers,
    recentSubmissions,
    recentReviews,
  ] = await Promise.all([
    db.event.count(),
    db.submission.count({ where: { status: "PENDING" } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.claimRequest.count({ where: { status: "PENDING" } }),
    db.subscriber.count(),
    db.submission.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    db.review.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const stats = [
    { label: "Total Events", value: totalEvents, icon: Calendar },
    { label: "Pending Submissions", value: pendingSubmissions, icon: Inbox },
    { label: "Pending Reviews", value: pendingReviews, icon: MessageSquare },
    { label: "Pending Claims", value: pendingClaims, icon: Shield },
    { label: "Subscribers", value: totalSubscribers, icon: Mail },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No submissions yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium">{sub.eventTitle}</p>
                      <p className="text-muted-foreground">
                        by {sub.submitterName}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(sub.createdAt)}
                    </span>
                  </div>
                ))}
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
