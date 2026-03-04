import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeIcon } from "@/components/badge-icon";

export const metadata = {
  title: "My Badges — Spokane Markets",
  description: "Achievements and badges you've earned",
};

export default async function BadgesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const [user, allBadges] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      include: {
        userBadges: { include: { badge: true } },
      },
    }),
    db.badgeDefinition.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!user) redirect("/auth/signin");

  const earnedSlugs = new Set(user.userBadges?.map((ub) => ub.badge.slug) ?? []);
  const userRole = user.role;

  const visibleBadges = allBadges.filter((b) => {
    if (b.requiredRole === "VENDOR" && userRole !== "VENDOR") return false;
    if (b.requiredRole === "ORGANIZER" && userRole !== "ORGANIZER" && userRole !== "ADMIN") return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Back to dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">My Badges</h1>
      <p className="mt-1 text-muted-foreground">
        Achievements you&apos;ve earned. Role-specific badges appear when you
        have that role.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleBadges.map((badge) => {
          const earned = earnedSlugs.has(badge.slug);
          return (
            <Card
              key={badge.id}
              className={earned ? "border-2" : "border border-dashed opacity-75"}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={
                      earned
                        ? "rounded-full bg-primary/20 p-2"
                        : "rounded-full bg-muted p-2"
                    }
                  >
                    <BadgeIcon
                      name={badge.icon}
                      className={earned ? "h-5 w-5 text-primary" : "h-5 w-5 text-muted-foreground"}
                    />
                  </div>
                  <CardTitle className="text-base">{badge.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {badge.description && (
                  <p className="text-sm text-muted-foreground">
                    {badge.description}
                  </p>
                )}
                <p
                  className={`mt-1 text-xs font-medium ${earned ? "text-primary" : "text-muted-foreground"}`}
                >
                  {earned ? "Earned" : "Locked"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
