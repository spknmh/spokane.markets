import { db } from "@/lib/db";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body?: string | null,
  link?: string | null
) {
  await db.notification.create({
    data: {
      userId,
      type,
      title,
      body: body ?? undefined,
      link: link ?? undefined,
    },
  });
}
