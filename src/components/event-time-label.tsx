import { formatEventTime } from "@/lib/utils";

interface EventTimeLabelProps {
  startDate: Date;
  endDate: Date;
  timezone?: string | null;
  className?: string;
}

export function EventTimeLabel({
  startDate,
  endDate,
  timezone,
  className,
}: EventTimeLabelProps) {
  const label = formatEventTime(startDate, endDate, timezone);
  return <span className={className}>{label}</span>;
}
