import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { FormsEditorClient } from "./forms-editor-client";

export default async function AdminApplicationFormsPage() {
  await requireAdmin();

  const forms = await db.applicationForm.findMany({
    orderBy: { type: "asc" },
  });

  const serialized = forms.map((f) => ({
    id: f.id,
    type: f.type,
    title: f.title,
    description: f.description,
    fields: f.fields as FormField[],
    active: f.active,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Application Form Fields
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure form fields for Vendor and Market applications.
        </p>
      </div>
      <FormsEditorClient initialForms={serialized} />
    </div>
  );
}

export type FormField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "email" | "checkbox";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
};
