"use client";

import { Label } from "@/components/ui/label";
import type { UseFormRegister, FieldValues } from "react-hook-form";

/** Horizontal / vertical focal point for `object-position` when cropping (0–100). */
export function ImageFocalSliders<T extends FieldValues>({
  register,
  idPrefix = "image",
  xField = "imageFocalX" as keyof T & string,
  yField = "imageFocalY" as keyof T & string,
}: {
  register: UseFormRegister<T>;
  idPrefix?: string;
  /** Defaults to profile image focal fields. */
  xField?: keyof T & string;
  yField?: keyof T & string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-focal-x`} className="text-xs text-muted-foreground">
          Image focus (left ↔ right)
        </Label>
        <input
          id={`${idPrefix}-focal-x`}
          type="range"
          min={0}
          max={100}
          className="w-full accent-primary"
          {...register(xField as never, { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-focal-y`} className="text-xs text-muted-foreground">
          Image focus (top ↔ bottom)
        </Label>
        <input
          id={`${idPrefix}-focal-y`}
          type="range"
          min={0}
          max={100}
          className="w-full accent-primary"
          {...register(yField as never, { valueAsNumber: true })}
        />
      </div>
    </div>
  );
}
