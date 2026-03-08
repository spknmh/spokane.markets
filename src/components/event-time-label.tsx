import { formatEventTime } from "@/lib/utils";

const PST = "America/Los_Angeles";

interface EventTimeLabelProps {
  startDate: Date;
  endDate: Date;
  /** Always PST for Spokane area. Kept for API compatibility. */
  timezone?: string | null;
  className?: string;
}

export function EventTimeLabel({
  startDate,
  endDate,
  timezone = PST,
  className,
}: EventTimeLabelProps) {
  const label = formatEventTime(startDate, endDate, timezone);
  return <span className={className}>{label}</span>;
}
