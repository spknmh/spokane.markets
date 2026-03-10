import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { NotificationsList } from "./notifications-list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await requireAuth("/notifications");

  const notifications = await db.notification.findMany({
    where: {
      userId: session.user.id!,
      archivedAt: null,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      link: true,
      severity: true,
      category: true,
      readAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Notifications
      </h1>
      <p className="mt-1 text-muted-foreground">
        Your recent activity and updates
      </p>

      <NotificationsList notifications={notifications} />
    </div>
  );
}
