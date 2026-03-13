"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import {
  generateRecurringSchedule,
  MAX_RECURRING_DAYS,
  type ScheduleDay,
} from "@/lib/recurring-schedule";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;

const DEFAULT_START_TIME = "08:00";
const DEFAULT_END_TIME = "14:00";

function buildTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const labelHour = hour % 12 || 12;
      const labelMinute = String(minute).padStart(2, "0");
      const period = hour >= 12 ? "PM" : "AM";
      options.push({ value, label: `${labelHour}:${labelMinute} ${period}` });
    }
  }
  const pivot = options.findIndex((opt) => opt.value === DEFAULT_START_TIME);
  if (pivot <= 0) return options;
  return [...options.slice(pivot), ...options.slice(0, pivot)];
}

const TIME_OPTIONS = buildTimeOptions();

function defaultStartDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function defaultEndDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

interface ScheduleRecurringGeneratorProps {
  onGenerate: (days: ScheduleDay[]) => void;
}

export function ScheduleRecurringGenerator({ onGenerate }: ScheduleRecurringGeneratorProps) {
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
  const [endTime, setEndTime] = useState(DEFAULT_END_TIME);
  const [warning, setWarning] = useState<string | null>(null);

  const toggleWeekday = (value: number) => {
    setWeekdays((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value].sort((a, b) => a - b)
    );
  };

  const handleGenerate = () => {
    setWarning(null);
    const days = generateRecurringSchedule(
      weekdays,
      startDate,
      endDate,
      allDay,
      allDay ? undefined : startTime,
      allDay ? undefined : endTime
    );

    if (days.length === 0) {
      setWarning("No days match. Select at least one weekday and ensure the date range is valid.");
      return;
    }

    if (days.length >= MAX_RECURRING_DAYS) {
      setWarning(
        `Generated ${MAX_RECURRING_DAYS} days (maximum). Schedule was truncated. Consider narrowing the date range.`
      );
    }

    onGenerate(days);
  };

  return (
    <details className="rounded-lg border border-border">
      <summary className="cursor-pointer p-4 font-medium">
        Generate recurring schedule
      </summary>
      <div className="space-y-4 border-t border-border p-4">
        <p className="text-xs text-muted-foreground">
          Select weekdays and a date range. Times apply to each matching day.
        </p>

        <div className="space-y-2">
          <Label>Repeat on</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary"
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={weekdays.includes(value)}
                  onChange={() => toggleWeekday(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="recur-start-date">From date</Label>
            <DatePickerInput
              id="recur-start-date"
              value={startDate}
              onChange={setStartDate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recur-end-date">To date</Label>
            <DatePickerInput
              id="recur-end-date"
              value={endDate}
              onChange={setEndDate}
            />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
          />
          <span className="text-sm">All day</span>
        </label>

        {!allDay && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recur-start-time">Start time</Label>
              <Select
                id="recur-start-time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                {TIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recur-end-time">End time</Label>
              <Select
                id="recur-end-time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              >
                {TIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {warning && (
          <p className="text-sm text-amber-600 dark:text-amber-500">{warning}</p>
        )}

        <Button type="button" variant="outline" onClick={handleGenerate}>
          Generate schedule
        </Button>
      </div>
    </details>
  );
}
