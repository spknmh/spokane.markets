import { z } from "zod";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const formFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
});

const putFormSchema = z.object({
  id: z.string().min(1, "Form ID is required"),
  title: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(formFieldSchema),
  active: z.boolean().optional(),
});

export async function GET() {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const forms = await db.applicationForm.findMany({
      orderBy: { type: "asc" },
      include: { _count: { select: { applications: true } } },
    });

    return NextResponse.json(forms);
  } catch (err) {
    console.error("[GET /api/admin/applications/forms]", err);
    return apiError("Internal server error", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const body = await request.json();
    const parsed = putFormSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const { id, title, description, fields, active } = parsed.data;

    const form = await db.applicationForm.update({
      where: { id },
      data: {
        title: title ?? undefined,
        description: description ?? undefined,
        fields,
        active: active ?? undefined,
      },
    });

    return NextResponse.json(form);
  } catch (err) {
    console.error("[PUT /api/admin/applications/forms]", err);
    return apiError("Internal server error", 500);
  }
}
