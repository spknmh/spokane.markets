import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  getNotificationType,
  getCategoryPrefField,
  type Severity,
  type Category,
} from "@/lib/notification-types";

export interface CreateNotificationOptions {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  severity?: Severity;
  category?: Category;
  actorId?: string | null;
  objectId?: string | null;
  objectType?: string | null;
  metadata?: Record<string, unknown> | null;
  /** Skip preference checks (e.g. for system-critical notifications) */
  force?: boolean;
}

/**
 * Create an in-app notification, respecting user preferences.
 * Returns the created notification or null if suppressed by preferences.
 */
export async function createNotification(opts: CreateNotificationOptions) {
  const typeDef = getNotificationType(opts.type);
  const severity = opts.severity ?? typeDef.severity;
  const category = opts.category ?? typeDef.category;

  if (!opts.force) {
    const prefs = await db.notificationPreference.findUnique({
      where: { userId: opts.userId },
    });

    if (prefs) {
      if (!prefs.inAppEnabled) return null;

      if (category) {
        const categoryField = getCategoryPrefField(category);
        const categoryEnabled = (prefs as Record<string, unknown>)[categoryField];
        if (categoryEnabled === false) return null;
      }
    }
  }

  return db.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body ?? undefined,
      link: opts.link ?? undefined,
      severity,
      category: category ?? undefined,
      actorId: opts.actorId ?? undefined,
      objectId: opts.objectId ?? undefined,
      objectType: opts.objectType ?? undefined,
      metadata: (opts.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

/**
 * Backwards-compatible shorthand for simple call sites.
 * Prefer the options-object form for new code.
 */
export async function createSimpleNotification(
  userId: string,
  type: string,
  title: string,
  body?: string | null,
  link?: string | null
) {
  return createNotification({ userId, type, title, body, link });
}
