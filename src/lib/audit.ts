import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function logAudit(
  userId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      ...(metadata !== undefined && {
        metadata: metadata as Prisma.InputJsonValue,
      }),
    },
  });
}
