import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissionSchemaAuthed } from "@/lib/validations";

const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function toOptional(value: string | undefined): string | undefined {
  if (value === undefined || value === "") return undefined;
  return value;
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    if (!email) {
      return NextResponse.json({ error: "Account email required" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = submissionSchemaAuthed.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const message = firstIssue?.message ?? "Validation failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    if (data.company && data.company.length > 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const submitterEmail = email.toLowerCase();

    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentCount = await db.submission.count({
      where: {
        submitterEmail,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount >= RATE_LIMIT_COUNT) {
      return NextResponse.json(
        {
          error:
            "You've reached the submission limit. Please try again in an hour.",
        },
        { status: 429 }
      );
    }

    const submitterName = session.user.name ?? "Unknown";

    await db.submission.create({
      data: {
        submitterName,
        submitterEmail,
        eventTitle: data.eventTitle,
        eventDescription: toOptional(data.eventDescription),
        eventDate: data.eventDate,
        eventTime: data.allDay ? "00:00" : (data.eventTime ?? "00:00"),
        endDate: toOptional(data.endDate),
        endTime: data.allDay ? "23:59" : toOptional(data.endTime),
        allDay: data.allDay ?? false,
        timezone: toOptional(data.timezone),
        imageUrl: toOptional(data.imageUrl),
        venueName: data.venueName,
        venueAddress: data.venueAddress,
        venueCity: toOptional(data.venueCity),
        venueState: toOptional(data.venueState),
        venueZip: toOptional(data.venueZip),
        marketId: toOptional(data.marketId),
        tagIds: data.tagIds ?? [],
        featureIds: data.featureIds ?? [],
        facebookUrl: toOptional(data.facebookUrl),
        websiteUrl: toOptional(data.websiteUrl),
        notes: toOptional(data.notes),
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Submission API error:", err);
    return NextResponse.json(
      { error: "Failed to submit event. Please try again." },
      { status: 500 }
    );
  }
}
