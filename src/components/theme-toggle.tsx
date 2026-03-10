"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSyncExternalStore } from "react";

interface ThemeToggleProps {
  /** Show "Dark Mode" / "Light Mode" label next to icon (e.g. for mobile nav) */
  showLabel?: boolean;
}

export function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme" className="h-10 w-10" disabled>
        <Sun className="h-4 w-4" aria-hidden />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Light Mode" : "Dark Mode";

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={showLabel ? "h-auto w-full justify-start gap-2" : "h-10 w-10"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Sun className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <Moon className="h-4 w-4 shrink-0" aria-hidden />
      )}
      {showLabel && <span>{label}</span>}
    </Button>
  );
}
