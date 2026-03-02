import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissionSchema } from "@/lib/validations";

const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function toOptional(value: string | undefined): string | undefined {
  if (value === undefined || value === "") return undefined;
  return value;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = submissionSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const message = firstIssue?.message ?? "Validation failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    if (data.company && data.company.length > 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const email = data.submitterEmail.toLowerCase();

    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentCount = await db.submission.count({
      where: {
        submitterEmail: email,
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

    await db.submission.create({
      data: {
        submitterName: data.submitterName,
        submitterEmail: email,
        eventTitle: data.eventTitle,
        eventDescription: toOptional(data.eventDescription),
        eventDate: data.eventDate,
        eventTime: data.eventTime,
        venueName: data.venueName,
        venueAddress: data.venueAddress,
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
