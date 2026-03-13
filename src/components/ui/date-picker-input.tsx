"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function parseDateOnly(value: string | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateOnlyValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(value: string | undefined): string {
  const parsed = parseDateOnly(value);
  if (!parsed) return "Select date";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

interface DatePickerInputProps {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function DatePickerInput({
  id,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = "Select date",
  className,
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const selected = React.useMemo(() => parseDateOnly(value), [value]);
  const label = value ? formatDisplayDate(value) : placeholder;

  React.useEffect(() => {
    if (!open) return;
    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/* Hidden input preserves native form semantics when needed. */}
      <input id={id} value={value ?? ""} readOnly required={required} className="sr-only" tabIndex={-1} />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className={cn(
          "w-full justify-between text-left font-normal",
          !value && "text-muted-foreground"
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{label}</span>
        <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-70" />
      </Button>
      {open && (
        <div className="absolute z-50 mt-2 rounded-md border border-border bg-background p-3 shadow-lg">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (!date) return;
              onChange(toDateOnlyValue(date));
              setOpen(false);
            }}
            captionLayout="dropdown"
            fromYear={2020}
            toYear={2035}
            classNames={{
              months: "flex flex-col",
              month: "space-y-3",
              caption: "flex items-center justify-between gap-2",
              caption_label: "text-sm font-medium",
              nav: "flex items-center gap-1",
              nav_button: "h-8 w-8 rounded-md border border-border hover:bg-muted",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell: "w-9 text-xs text-muted-foreground font-medium",
              row: "mt-1 flex w-full",
              cell: "h-9 w-9 p-0 text-center",
              day: "h-9 w-9 rounded-md text-sm hover:bg-muted",
              day_today: "border border-border font-semibold",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary",
              day_outside: "text-muted-foreground opacity-50",
            }}
          />
        </div>
      )}
    </div>
  );
}
