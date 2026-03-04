"use client";

import {
  Calendar,
  Award,
  Star,
  MapPin,
  Heart,
  Store,
  CalendarCheck,
  Trophy,
  Building2,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Calendar,
  Award,
  Star,
  MapPin,
  Heart,
  Store,
  CalendarCheck,
  Trophy,
  Building2,
};

export function BadgeIcon({ name, className }: { name: string | null; className?: string }) {
  if (!name) return null;
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className ?? "h-3.5 w-3.5"} />;
}
