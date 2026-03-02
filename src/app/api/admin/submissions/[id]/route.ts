import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (status !== "APPROVED" && status !== "REJECTED") {
    return NextResponse.json(
      { error: { message: "Status must be APPROVED or REJECTED" } },
      { status: 400 }
    );
  }

  const submission = await db.submission.update({
    where: { id },
    data: {
      status,
      reviewerId: session.user.id,
    },
  });

  return NextResponse.json(submission);
}
