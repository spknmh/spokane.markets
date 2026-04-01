"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import "react-day-picker/style.css";

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

/**
 * react-day-picker v9 requires `react-day-picker/style.css`. Without it, the
 * month/year dropdowns and day hit-targets render incorrectly (duplicate labels,
 * offset hovers). Theme via CSS variables on the root.
 */
const pickerThemeStyle = {
  "--rdp-accent-color": "var(--color-primary)",
  "--rdp-accent-background-color": "color-mix(in srgb, var(--color-primary) 14%, transparent)",
} as React.CSSProperties;

const defaultClassNames = getDefaultClassNames();

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

  const displayMonth = selected ?? new Date();

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
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="truncate">{label}</span>
        <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-70" />
      </Button>
      {open && (
        <div
          className="absolute z-50 mt-2 min-w-[min(100vw-2rem,20rem)] rounded-md border border-border bg-background p-2 shadow-lg"
          role="dialog"
          aria-label="Choose date"
        >
          <DayPicker
            mode="single"
            selected={selected}
            defaultMonth={displayMonth}
            onSelect={(date) => {
              if (!date) return;
              onChange(toDateOnlyValue(date));
              setOpen(false);
            }}
            captionLayout="dropdown"
            navLayout="around"
            startMonth={new Date(2020, 0)}
            endMonth={new Date(2035, 11)}
            style={pickerThemeStyle}
            classNames={{
              ...defaultClassNames,
              root: cn(defaultClassNames.root, "font-sans text-sm text-foreground"),
              button_previous: cn(
                defaultClassNames.button_previous,
                "rounded-md border border-border bg-background hover:bg-muted"
              ),
              button_next: cn(
                defaultClassNames.button_next,
                "rounded-md border border-border bg-background hover:bg-muted"
              ),
            }}
          />
        </div>
      )}
    </div>
  );
}
