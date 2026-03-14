import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

const memberRoleSchema = z.enum(["OWNER", "MANAGER", "VOLUNTEER", "STAFF"]);
const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: memberRoleSchema,
});
const removeMemberSchema = z.object({
  userId: z.string().min(1),
});

async function requireOwnerOrAdmin(marketId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (session.user.role === "ADMIN") {
    return { session };
  }

  const ownerMembership = await db.market.findFirst({
    where: {
      id: marketId,
      OR: [
        { ownerId: session.user.id },
        {
          memberships: {
            some: { userId: session.user.id, role: "OWNER" },
          },
        },
      ],
    },
    select: { id: true },
  });

  if (!ownerMembership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { session };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: marketId } = await params;
  const authResult = await requireOwnerOrAdmin(marketId);
  if ("error" in authResult && authResult.error) return authResult.error;
  const { session } = authResult as { session: NonNullable<typeof authResult.session> };

  const body = await request.json();
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const member = await db.marketMembership.upsert({
    where: {
      marketId_userId: {
        marketId,
        userId: parsed.data.userId,
      },
    },
    update: { role: parsed.data.role },
    create: {
      marketId,
      userId: parsed.data.userId,
      role: parsed.data.role,
    },
  });

  await db.user.update({
    where: { id: parsed.data.userId },
    data: { role: "ORGANIZER" },
  });

  await logAudit(session.user.id, "ADD_MARKET_MEMBER", "MARKET", marketId, {
    memberUserId: parsed.data.userId,
    role: parsed.data.role,
  });

  return NextResponse.json(member, { status: 201 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: marketId } = await params;
  const authResult = await requireOwnerOrAdmin(marketId);
  if ("error" in authResult && authResult.error) return authResult.error;
  const { session } = authResult as { session: NonNullable<typeof authResult.session> };

  const body = await request.json();
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const member = await db.marketMembership.update({
    where: {
      marketId_userId: {
        marketId,
        userId: parsed.data.userId,
      },
    },
    data: { role: parsed.data.role },
  });

  await logAudit(session.user.id, "UPDATE_MARKET_MEMBER_ROLE", "MARKET", marketId, {
    memberUserId: parsed.data.userId,
    role: parsed.data.role,
  });

  return NextResponse.json(member);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: marketId } = await params;
  const authResult = await requireOwnerOrAdmin(marketId);
  if ("error" in authResult && authResult.error) return authResult.error;
  const { session } = authResult as { session: NonNullable<typeof authResult.session> };

  const body = await request.json();
  const parsed = removeMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  await db.marketMembership.delete({
    where: {
      marketId_userId: {
        marketId,
        userId: parsed.data.userId,
      },
    },
  });

  await logAudit(session.user.id, "REMOVE_MARKET_MEMBER", "MARKET", marketId, {
    memberUserId: parsed.data.userId,
  });

  return NextResponse.json({ success: true });
}
