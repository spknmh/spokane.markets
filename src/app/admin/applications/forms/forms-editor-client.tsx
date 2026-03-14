"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FormField } from "./page";
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";

type ApplicationFormType = "VENDOR" | "MARKET" | "VENDOR_VERIFICATION";

interface SerializedForm {
  id: string;
  type: ApplicationFormType;
  title: string;
  description: string | null;
  fields: FormField[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormsEditorClientProps {
  initialForms: SerializedForm[];
}

const FIELD_TYPES: FormField["type"][] = [
  "text",
  "textarea",
  "select",
  "email",
  "checkbox",
];

function generateFieldId(): string {
  return `field_${Date.now()}`;
}

function FormCard({
  form,
  onChange,
}: {
  form: SerializedForm;
  onChange: (form: SerializedForm) => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/applications/forms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          title: form.title,
          description: form.description ?? undefined,
          fields: form.fields,
          active: form.active,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function moveField(index: number, direction: "up" | "down") {
    const newFields = [...form.fields];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newFields.length) return;
    [newFields[index], newFields[target]] = [newFields[target], newFields[index]];
    onChange({ ...form, fields: newFields });
  }

  function updateField(index: number, updates: Partial<FormField>) {
    const newFields = [...form.fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange({ ...form, fields: newFields });
  }

  function addField() {
    onChange({
      ...form,
      fields: [
        ...form.fields,
        {
          id: generateFieldId(),
          label: "New field",
          type: "text",
          required: false,
        },
      ],
    });
  }

  function removeField(index: number) {
    const newFields = form.fields.filter((_, i) => i !== index);
    onChange({ ...form, fields: newFields });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Input
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            className="text-lg font-semibold h-9"
            placeholder="Form title"
          />
        </CardTitle>
        <CardDescription>
          <Textarea
            value={form.description ?? ""}
            onChange={(e) =>
              onChange({ ...form, description: e.target.value || null })
            }
            placeholder="Form description (optional)"
            className="min-h-[60px] resize-y"
          />
        </CardDescription>
        <div className="flex items-center gap-2 pt-2">
          <Switch
            checked={form.active}
            onCheckedChange={(active) => onChange({ ...form, active })}
          />
          <Label className="text-sm font-medium">Active</Label>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Fields</Label>
          <div className="space-y-2">
            {form.fields.map((field, index) => (
              <FieldEditor
                key={field.id}
                field={field}
                index={index}
                total={form.fields.length}
                onUpdate={(updates) => updateField(index, updates)}
                onMoveUp={() => moveField(index, "up")}
                onMoveDown={() => moveField(index, "down")}
                onRemove={() => removeField(index)}
              />
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            Add field
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

function FieldEditor({
  field,
  index,
  total,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  field: FormField;
  index: number;
  total: number;
  onUpdate: (updates: Partial<FormField>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="flex-1 font-medium truncate">
          {field.label || "Untitled field"}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">
          {field.type}
          {field.required && " · required"}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", expanded && "rotate-180")}
        />
      </button>
      {expanded && (
        <div className="border-t border-border p-4 space-y-4 bg-background">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={field.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                placeholder="Field label"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={field.type}
                onChange={(e) =>
                  onUpdate({
                    type: e.target.value as FormField["type"],
                    options: e.target.value === "select" ? [""] : undefined,
                  })
                }
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={field.required ?? false}
              onCheckedChange={(required) => onUpdate({ required })}
            />
            <Label className="text-sm">Required</Label>
          </div>
          <div className="space-y-2">
            <Label>Placeholder (optional)</Label>
            <Input
              value={field.placeholder ?? ""}
              onChange={(e) => onUpdate({ placeholder: e.target.value || undefined })}
              placeholder="Placeholder text"
            />
          </div>
          <div className="space-y-2">
            <Label>Help text (optional)</Label>
            <Input
              value={field.helpText ?? ""}
              onChange={(e) => onUpdate({ helpText: e.target.value || undefined })}
              placeholder="Helper text shown below field"
            />
          </div>
          {field.type === "select" && (
            <div className="space-y-2">
              <Label>Options (one per line)</Label>
              <Textarea
                value={(field.options ?? []).join("\n")}
                onChange={(e) =>
                  onUpdate({
                    options: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                className="min-h-[80px]"
              />
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp();
                }}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown();
                }}
                disabled={index === total - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function FormsEditorClient({ initialForms }: FormsEditorClientProps) {
  const [forms, setForms] = React.useState<SerializedForm[]>(initialForms);

  function updateForm(index: number, form: SerializedForm) {
    setForms((prev) => {
      const next = [...prev];
      next[index] = form;
      return next;
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {forms.map((form, index) => (
        <FormCard
          key={form.id}
          form={form}
          onChange={(f) => updateForm(index, f)}
        />
      ))}
    </div>
  );
}
